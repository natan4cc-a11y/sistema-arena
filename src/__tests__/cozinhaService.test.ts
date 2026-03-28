import { RealtimeChannel } from '@supabase/supabase-js';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { cozinhaService } from '../services/cozinhaService';
import { supabase } from '../lib/supabase';

// Simulamos as funções do Supabase (incluindo as de tempo real)
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

describe('Serviço da Cozinha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Esconde o console.error apenas durante os testes para manter o terminal limpo
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('deve buscar os pedidos que não estão prontos ordenados pelo horário', async () => {
    const pedidosMock = [
      { id: 10, nome_produto: 'Batata Frita', status: 'pendente' },
      { id: 11, nome_produto: 'Porção de Isca', status: 'preparando' }
    ];

    // Encadeamento: from().select().neq().order()
    const mockOrder = vi.fn().mockResolvedValue({ data: pedidosMock, error: null });
    const mockNeq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ neq: mockNeq });
    
    (supabase.from as Mock).mockReturnValue({ select: mockSelect });

    const resultado = await cozinhaService.buscarPedidosPendentes();

    expect(supabase.from).toHaveBeenCalledWith('pedidos_mesa');
    expect(mockSelect).toHaveBeenCalledWith('*');
    // Verifica se usou o .neq() para não pegar os pedidos prontos
    expect(mockNeq).toHaveBeenCalledWith('status', 'pronto');
    expect(mockOrder).toHaveBeenCalledWith('horario', { ascending: true });
    expect(resultado).toEqual(pedidosMock);
  });

  it('deve retornar uma lista vazia e avisar no console se falhar na busca', async () => {
    // Simulando um erro do banco de dados
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('Erro de conexão') });
    const mockNeq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ neq: mockNeq });
    
    (supabase.from as Mock).mockReturnValue({ select: mockSelect });

    const resultado = await cozinhaService.buscarPedidosPendentes();

    // Deve retornar o array vazio como programado no seu service
    expect(resultado).toEqual([]);
    // Garante que a sua proteção (console.error) foi chamada
    expect(console.error).toHaveBeenCalled();
  });

  it('deve mudar o status do pedido para pronto', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

    (supabase.from as Mock).mockReturnValue({ update: mockUpdate });

    await cozinhaService.marcarComoPronto(55);

    expect(supabase.from).toHaveBeenCalledWith('pedidos_mesa');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'pronto' });
    expect(mockEq).toHaveBeenCalledWith('id', 55);
  });

 it('deve criar a inscrição no canal em tempo real do Supabase', () => {
    // Criamos um objeto falso para representar o canal
    const mockCanalRetornado = { topic: 'schema-db-changes' } as unknown as RealtimeChannel; 
    
    // Agora dizemos para o subscribe retornar o nosso objeto falso
    const mockSubscribe = vi.fn().mockReturnValue(mockCanalRetornado);
    const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
    (supabase.channel as Mock).mockReturnValue({ on: mockOn });

    const onUpdateFake = vi.fn();

    const canalRetornado = cozinhaService.inscreverAtualizacoes(onUpdateFake);

    expect(supabase.channel).toHaveBeenCalledWith('schema-db-changes');
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'pedidos_mesa' }, 
      expect.any(Function)
    );
    expect(mockSubscribe).toHaveBeenCalled();
    expect(canalRetornado).toEqual(mockCanalRetornado); 
  });

  it('deve remover a inscrição do canal em tempo real corretamente', () => {
    // Criamos um objeto falso (Mock) para representar o RealtimeChannel
    const canalFake = { topic: 'schema-db-changes' } as unknown as RealtimeChannel;

    cozinhaService.removerInscricao(canalFake);

    expect(supabase.removeChannel).toHaveBeenCalledWith(canalFake);
  });
});