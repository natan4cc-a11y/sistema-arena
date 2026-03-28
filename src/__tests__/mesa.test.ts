import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { mesasService } from '../services/mesasService';
import { supabase } from '../lib/supabase';
import { Mesa, ItemPedido, Produto } from '../types';

// Simulamos o módulo do Supabase, incluindo a função 'rpc' usada para baixar o stock
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('Serviço de Mesas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar as mesas ordenadas por id', async () => {
    const mesasMock = [{ id: 1, status: 'livre', total: 0 }];
    const mockOrder = vi.fn().mockResolvedValue({ data: mesasMock });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    
    (supabase.from as Mock).mockReturnValue({ select: mockSelect });

    const resultado = await mesasService.getMesas();

    expect(supabase.from).toHaveBeenCalledWith('mesas');
    expect(mockOrder).toHaveBeenCalledWith('id', { ascending: true });
    expect(resultado).toEqual(mesasMock);
  });

  it('deve abrir uma mesa atualizando o status e limpando pedidos antigos', async () => {
    // Preparamos os mocks para o update (na tabela mesas) e delete (na tabela pedidos_mesa)
    const mockEqUpdate = vi.fn().mockResolvedValue({});
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

    const mockEqDelete = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEqDelete });

    // Ensinamos o Mock a devolver a função certa dependendo da tabela chamada
    (supabase.from as Mock).mockImplementation((tabela) => {
      if (tabela === 'mesas') return { update: mockUpdate };
      if (tabela === 'pedidos_mesa') return { delete: mockDelete };
    });

    await mesasService.abrirMesa(5, 'João Silva');

    // Verifica se atualizou a mesa corretamente
    expect(supabase.from).toHaveBeenCalledWith('mesas');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'ocupada', cliente: 'João Silva', total: 0 });
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 5);

    // Verifica se limpou os pedidos travados
    expect(supabase.from).toHaveBeenCalledWith('pedidos_mesa');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEqDelete).toHaveBeenCalledWith('id_mesa', 5);
  });

  it('deve processar o pagamento parcial e abater no total da mesa', async () => {
    // 1. Mock para o insert em Vendas
    const mockInsert = vi.fn().mockResolvedValue({});
    
    // 2. Mock para o delete (usando 'in') em Pedidos da Mesa
    const mockIn = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockReturnValue({ in: mockIn });
    
    // 3. Mock para o update (usando 'eq') na Mesa
    const mockEqUpdate = vi.fn().mockResolvedValue({});
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

    (supabase.from as Mock).mockImplementation((tabela) => {
      if (tabela === 'vendas') return { insert: mockInsert };
      if (tabela === 'pedidos_mesa') return { delete: mockDelete };
      if (tabela === 'mesas') return { update: mockUpdate };
    });

    // Dados de teste
    const mesaMock: Partial<Mesa> = { id: 1, status: 'ocupada', total: 100, cliente: 'Maria' };
    const itensMock: Partial<ItemPedido>[] = [
      { id: 10, nome_produto: 'Cerveja', preco: 15 },
      { id: 11, nome_produto: 'Batata', preco: 25 }
    ]; 
    const idsSelecionados = [10, 11];

    // O pagamento parcial soma 15 + 25 = 40. O total era 100. Deve sobrar 60.
    const novoTotal = await mesasService.pagamentoParcial(
      mesaMock as Mesa, 
      itensMock as ItemPedido[], 
      idsSelecionados
    );

    // Verificações
    expect(novoTotal).toBe(60); 

    // Verificou se registou a venda parcial?
    expect(mockInsert).toHaveBeenCalledWith([{
        cliente: 'Maria (Parcial)',
        total: 40,
        itens: [{ nome: 'Cerveja', preco: 15 }, { nome: 'Batata', preco: 25 }]
    }]);

    // Verificou se removeu os itens da mesa?
    expect(mockIn).toHaveBeenCalledWith('id', idsSelecionados);

    // Verificou se atualizou o total da mesa?
    expect(mockUpdate).toHaveBeenCalledWith({ total: 60 });
    expect(mockEqUpdate).toHaveBeenCalledWith('id', 1);
  });

  it('deve adicionar um pedido à mesa e atualizar o stock', async () => {
    const mockInsert = vi.fn().mockResolvedValue({});
    const mockEqUpdate = vi.fn().mockResolvedValue({});
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });
    const rpcMock = vi.fn().mockResolvedValue({});

    (supabase.from as Mock).mockImplementation((tabela) => {
      if (tabela === 'pedidos_mesa') return { insert: mockInsert };
      if (tabela === 'mesas') return { update: mockUpdate };
    });
    (supabase.rpc as Mock).mockImplementation(rpcMock);

    const produtoMock = { 
      id: 99, 
      nome: 'Refrigerante', 
      preco: 8, 
      categoria: 'bebida', 
      estoque_atual: 10 
    } as Produto;
    
    // Tinha 50 de total na mesa, comprou algo de 8, deve ir para 58
    const resultado = await mesasService.adicionarPedido(1, produtoMock, 'Sem gelo', 50);

    expect(resultado).toBe(58);
    expect(mockInsert).toHaveBeenCalledWith([
      { id_mesa: 1, nome_produto: 'Refrigerante', preco: 8, observacao: 'Sem gelo', status: 'pendente' }
    ]);
    
    // Verifica se chamou a function de diminuir stock no Supabase
    expect(supabase.rpc).toHaveBeenCalledWith('decrement_estoque', { row_id: 99 });
  });
});