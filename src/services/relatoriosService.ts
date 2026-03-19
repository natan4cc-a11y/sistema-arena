import { supabase } from '../lib/supabase';
import { Venda } from '../types';

export const relatoriosService = {
  async getUltimasVendas(): Promise<Venda[]> {
    const { data } = await supabase
      .from('vendas')
      .select('*')
      .order('data_venda', { ascending: false })
      .limit(50);

    return data || [];
  }
};