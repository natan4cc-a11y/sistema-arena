import { supabase } from '../lib/supabase';
import { Mesa, Produto, ItemPedido } from '../types';

export const mesasService = {
  async getMesas(): Promise<Mesa[]> {
    const { data } = await supabase.from('mesas').select('*').order('id', { ascending: true });
    return data || [];
  },

  async getProdutos(): Promise<Produto[]> {
    const { data } = await supabase.from('produtos').select('*').order('nome', { ascending: true });
    return data || [];
  },

  async getItensDaMesa(idMesa: number): Promise<ItemPedido[]> {
    const { data } = await supabase.from('pedidos_mesa').select('*').eq('id_mesa', idMesa).order('horario', { ascending: false });
    return data || [];
  },

  async abrirMesa(id: number, nomeCliente: string): Promise<void> {
    await supabase.from('mesas').update({ status: 'ocupada', cliente: nomeCliente, total: 0 }).eq('id', id);
    // Limpa pedidos antigos que possam ter ficado travados na mesa
    await supabase.from('pedidos_mesa').delete().eq('id_mesa', id);
  },

  async adicionarPedido(idMesa: number, produto: Produto, observacao: string, totalAtual: number): Promise<number> {
    // Adicionado o status 'pendente' para a cozinha ver
    await supabase.from('pedidos_mesa').insert([
      { id_mesa: idMesa, nome_produto: produto.nome, preco: produto.preco, observacao, status: 'pendente' }
    ]);
    
    // Baixa o estoque automaticamente
    await supabase.rpc('decrement_estoque', { row_id: produto.id });
    
    const novoTotal = totalAtual + produto.preco;
    await supabase.from('mesas').update({ total: novoTotal }).eq('id', idMesa);
    return novoTotal;
  },

  // NOVA FUNÇÃO: Pagamento Parcial transferido da tela para cá
  async pagamentoParcial(mesa: Mesa, itensParaPagar: ItemPedido[], selecionadosIds: number[]): Promise<number> {
    const totalParcial = itensParaPagar.reduce((acc, item) => acc + item.preco, 0);

    // 1. Registra a venda
    await supabase.from('vendas').insert([{ 
      cliente: `${mesa.cliente} (Parcial)`, 
      total: totalParcial, 
      itens: itensParaPagar.map(i => ({ nome: i.nome_produto, preco: i.preco })) 
    }]);

    // 2. Remove da mesa
    await supabase.from('pedidos_mesa').delete().in('id', selecionadosIds);

    // 3. Atualiza o total da mesa
    const novoTotalMesa = Math.max(0, (mesa.total || 0) - totalParcial);
    await supabase.from('mesas').update({ total: novoTotalMesa }).eq('id', mesa.id);

    return novoTotalMesa;
  },

  async fecharMesa(mesa: Mesa): Promise<void> {
    const { data: itensFinais } = await supabase.from('pedidos_mesa').select('nome_produto, preco').eq('id_mesa', mesa.id);
    await supabase.from('vendas').insert([{ cliente: mesa.cliente, total: mesa.total, itens: itensFinais }]);
    await supabase.from('pedidos_mesa').delete().eq('id_mesa', mesa.id);
    await supabase.from('mesas').update({ status: 'livre', cliente: null, total: 0 }).eq('id', mesa.id);
  }
};