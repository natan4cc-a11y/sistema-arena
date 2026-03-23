import { supabase } from '../lib/supabase';
import { Venda } from '../types';

export type PeriodoRelatorio = 'hoje' | 'semana' | 'mes' | 'todos';

export const relatoriosService = {
  async getVendasPorPeriodo(periodo: PeriodoRelatorio): Promise<Venda[]> {
    let query = supabase.from('vendas').select('*');
    
    const agora = new Date();
    const dataInicio = new Date();

    if (periodo === 'hoje') {
      dataInicio.setHours(0, 0, 0, 0);
      query = query.gte('data_venda', dataInicio.toISOString());
    } else if (periodo === 'semana') {
      dataInicio.setDate(agora.getDate() - 7);
      query = query.gte('data_venda', dataInicio.toISOString());
    } else if (periodo === 'mes') {
      dataInicio.setMonth(agora.getMonth() - 1);
      query = query.gte('data_venda', dataInicio.toISOString());
    }

    // Ordena usando a sua coluna data_venda
    const { data, error } = await query.order('data_venda', { ascending: false });

    if (error) {
      console.error("Erro no Service Financeiro:", error);
      throw error;
    }

    return (data as Venda[]) || [];
  }
};