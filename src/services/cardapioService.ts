import { supabase } from '../lib/supabase';
import { Produto } from '../types';

export const cardapioService = {
  async getProdutos(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error("Erro no Service Cardápio:", error);
      throw error;
    }
    return (data as Produto[]) || [];
  },

  // Aceita o tipo exato que está no seu index.ts para categoria
  async adicionarProduto(nome: string, preco: number, categoria: Produto['categoria'], estoque: number): Promise<void> {
    const { error } = await supabase.from('produtos').insert([{ 
      nome: nome, 
      preco: preco, 
      categoria: categoria,
      estoque_atual: estoque
    }]);

    if (error) throw new Error(error.message);
  },

  // Nova função para a edição completa da modal
  async editarProduto(id: number, nome: string, preco: number, categoria: Produto['categoria'], estoque: number): Promise<void> {
    const { error } = await supabase
      .from('produtos')
      .update({
        nome: nome,
        preco: preco,
        categoria: categoria,
        estoque_atual: estoque
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // Nova função para os botões de + e - no card
  async atualizarEstoque(id: number, novaQuantidade: number): Promise<void> {
    const { error } = await supabase
      .from('produtos')
      .update({ estoque_atual: novaQuantidade })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async deletarProduto(id: number): Promise<void> {
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw new Error('Erro ao apagar item.');
  }
};