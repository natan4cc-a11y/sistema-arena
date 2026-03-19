import { supabase } from '../lib/supabase';
import { Funcionario } from '../types';

export const cadastroService = {
  async getFuncionarios(): Promise<Funcionario[]> {
    const { data } = await supabase.from('funcionarios').select('*').order('nome_completo', { ascending: true });
    return data || [];
  },

  async cadastrarFuncionario(nome: string, cargo: string, senha: string): Promise<void> {
    await supabase.from('funcionarios').insert([
      { nome_completo: nome, cargo, senha }
    ]);
  },

  async deletarFuncionario(id: number): Promise<void> {
    await supabase.from('funcionarios').delete().eq('id', id);
  }
};