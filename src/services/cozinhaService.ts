import { supabase } from '../lib/supabase';
import { PedidoCozinha } from '../types';

export const cozinhaService = {
  async buscarPedidosPendentes(): Promise<PedidoCozinha[]> {
    const { data } = await supabase
      .from('pedidos_mesa')
      .select('*')
      .eq('status', 'pendente')
      .order('horario', { ascending: true });
    
    return data || [];
  },

  async marcarComoPronto(idPedido: number): Promise<void> {
    await supabase
      .from('pedidos_mesa')
      .update({ status: 'pronto' })
      .eq('id', idPedido);
  }
};