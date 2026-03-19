import { supabase } from '../lib/supabase';
import { Produto } from '../types';

export const cardapioService = {
  async getProdutos(): Promise<Produto[]> {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true });
    
    return data || [];
  },

  async adicionarProduto(nome: string, preco: number, categoria: 'bebida' | 'comida', estoque: number): Promise<void> {
    const { error } = await supabase.from('produtos').insert([{ 
      nome: nome, 
      preco: preco, 
      categoria: categoria,
      estoque_atual: estoque
    }]);

    if (error) throw new Error(error.message);
  },

  async deletarProduto(id: number): Promise<void> {
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw new Error('Erro ao apagar item.');
  }
};