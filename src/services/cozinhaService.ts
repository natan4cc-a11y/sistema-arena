import { supabase } from '../lib/supabase';
import { PedidoCozinha } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export const cozinhaService = {
  async buscarPedidosPendentes(): Promise<PedidoCozinha[]> {
    const { data, error } = await supabase
      .from('pedidos_mesa')
      .select('*')
      // Ajustado para neq('pronto') para garantir que pegue 'pendente' ou 'preparando'
      .neq('status', 'pronto') 
      .order('horario', { ascending: true });
    
    if (error) {
        console.error("Erro no Service Cozinha:", error);
        return [];
    }
    return data || [];
  },

  async marcarComoPronto(idPedido: number): Promise<void> {
    const { error } = await supabase
      .from('pedidos_mesa')
      .update({ status: 'pronto' })
      .eq('id', idPedido);
      
    if (error) throw error;
  },

  // NOVA FUNÇÃO: O "Radar" de tempo real foi transferido da página para cá
  inscreverAtualizacoes(onUpdate: () => void) {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_mesa' }, () => {
        onUpdate(); 
      })
      .subscribe();

    return channel;
  },

  removerInscricao(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  }
};