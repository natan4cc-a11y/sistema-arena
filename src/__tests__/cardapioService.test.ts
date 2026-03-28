import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { cardapioService } from '../services/cardapioService';
import { supabase } from '../lib/supabase';

// Simulamos o módulo do Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Serviço de Cardápio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar os produtos ordenados pelo nome', async () => {
    const produtosMock = [
      { id: 1, nome: 'Cerveja', preco: 10, categoria: 'bebida', estoque_atual: 50 }
    ];
    
    const mockOrder = vi.fn().mockResolvedValue({ data: produtosMock, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    
    // Substituindo o 'any' por 'Mock'
    (supabase.from as Mock).mockReturnValue({ select: mockSelect });

    const resultado = await cardapioService.getProdutos();

    expect(supabase.from).toHaveBeenCalledWith('produtos');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('nome', { ascending: true });
    expect(resultado).toEqual(produtosMock);
  });

  it('deve lançar um erro se falhar ao buscar produtos', async () => {
    const erroMock = new Error('Erro de conexão');
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: erroMock });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    
    // Substituindo o 'any' por 'Mock'
    (supabase.from as Mock).mockReturnValue({ select: mockSelect });

    await expect(cardapioService.getProdutos()).rejects.toThrow();
  });

  it('deve atualizar o estoque de um produto corretamente', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    
    // Substituindo o 'any' por 'Mock'
    (supabase.from as Mock).mockReturnValue({ update: mockUpdate });

    await cardapioService.atualizarEstoque(1, 45);

    expect(supabase.from).toHaveBeenCalledWith('produtos');
    expect(mockUpdate).toHaveBeenCalledWith({ estoque_atual: 45 });
    expect(mockEq).toHaveBeenCalledWith('id', 1);
  });

  it('deve adicionar um novo produto', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    
    // Substituindo o 'any' por 'Mock'
    (supabase.from as Mock).mockReturnValue({ insert: mockInsert });

    await cardapioService.adicionarProduto('Batata Frita', 25, 'comida', 10);

    expect(supabase.from).toHaveBeenCalledWith('produtos');
    expect(mockInsert).toHaveBeenCalledWith([{
      nome: 'Batata Frita',
      preco: 25,
      categoria: 'comida',
      estoque_atual: 10
    }]);
  });
});