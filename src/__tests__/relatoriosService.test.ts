import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { relatoriosService } from '../services/relatoriosService';
import { supabase } from '../lib/supabase';

// Simulamos o módulo do Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Serviço de Relatórios e Faturação', () => {
  // Variáveis para guardar as simulações encadeadas
  let mockOrder: Mock;
  let mockGte: Mock;
  let mockSelect: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // "Congelamos" o relógio do sistema numa data fixa (ex: 15 de Outubro de 2025 ao meio-dia)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-10-15T12:00:00.000Z'));

    // Configuramos o encadeamento dinâmico: select() -> gte() -> order()
    mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    // O .gte devolve-se a si mesmo e ao .order para continuar a cadeia
    mockGte = vi.fn().mockReturnValue({ order: mockOrder, gte: vi.fn() }); 
    mockSelect = vi.fn().mockReturnValue({ order: mockOrder, gte: mockGte });
    
    (supabase.from as Mock).mockReturnValue({ select: mockSelect });
  });

  afterEach(() => {
    // Devolve o relógio ao tempo real após cada teste
    vi.useRealTimers();
  });

  it('deve buscar todas as vendas sem filtro de data quando o período for "todos"', async () => {
    const vendasMock = [{ id: 1, total: 120, cliente: 'Mesa 3', data_venda: '2025-10-15' }];
    mockOrder.mockResolvedValueOnce({ data: vendasMock, error: null });

    const resultado = await relatoriosService.getVendasPorPeriodo('todos');

    expect(supabase.from).toHaveBeenCalledWith('vendas');
    expect(mockSelect).toHaveBeenCalledWith('*');
    // Para 'todos', o filtro .gte (greater than or equal) não deve ser chamado
    expect(mockGte).not.toHaveBeenCalled();
    expect(mockOrder).toHaveBeenCalledWith('data_venda', { ascending: false });
    expect(resultado).toEqual(vendasMock);
  });

  it('deve filtrar as vendas para o período "hoje" (a partir da meia-noite)', async () => {
    await relatoriosService.getVendasPorPeriodo('hoje');

    // Calculamos a meia-noite exata do dia configurado no mock (15/10/2025)
    const dataEsperada = new Date('2025-10-15T12:00:00.000Z');
    dataEsperada.setHours(0, 0, 0, 0);

    expect(mockGte).toHaveBeenCalledWith('data_venda', dataEsperada.toISOString());
    expect(mockOrder).toHaveBeenCalled();
  });

  it('deve filtrar as vendas para o período "semana" (7 dias atrás)', async () => {
    await relatoriosService.getVendasPorPeriodo('semana');

    const dataEsperada = new Date('2025-10-15T12:00:00.000Z');
    dataEsperada.setDate(dataEsperada.getDate() - 7);

    expect(mockGte).toHaveBeenCalledWith('data_venda', dataEsperada.toISOString());
  });

  it('deve filtrar as vendas para o período "mes" (1 mês atrás)', async () => {
    await relatoriosService.getVendasPorPeriodo('mes');

    const dataEsperada = new Date('2025-10-15T12:00:00.000Z');
    dataEsperada.setMonth(dataEsperada.getMonth() - 1);

    expect(mockGte).toHaveBeenCalledWith('data_venda', dataEsperada.toISOString());
  });

  it('deve lançar um erro e registar na consola se a base de dados falhar', async () => {
    // Esconde o erro da consola durante o teste
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const erroMock = new Error('Falha na base de dados');
    mockOrder.mockResolvedValueOnce({ data: null, error: erroMock });

    await expect(relatoriosService.getVendasPorPeriodo('hoje')).rejects.toThrow('Falha na base de dados');
    expect(console.error).toHaveBeenCalled();
  });
});