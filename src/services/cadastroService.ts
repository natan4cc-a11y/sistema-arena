import { supabase } from '../lib/supabase';
import { Funcionario } from '../types';

export const cadastroService = {
  // 1. BUSCAR TODOS OS FUNCIONÁRIOS
  async getFuncionarios(): Promise<Funcionario[]> {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .order('nome_completo', { ascending: true });

      if (error) {
        console.error("Erro Supabase (Get):", error.message);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      throw error;
    }
  },

  // 2. CADASTRAR NOVO INTEGRANTE (Ajustado para seu Tipo)
  async cadastrarFuncionario(nome: string, cargo: string, senha: string) {
    try {
      // IMPORTANTE: Verifique se no seu banco a coluna é 'nome_completo'
      const { data, error } = await supabase
        .from('funcionarios')
        .insert([
          { 
            nome_completo: nome, 
            cargo: cargo, 
            senha: senha 
            
          }
        ])
        .select();

      if (error) {
        // Isso aqui vai matar o "Erro Desconhecido" e mostrar a real causa
        console.error("Erro Detalhado Supabase (Insert):", error.message, error.details);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      // Repassa o erro para o 'catch' da sua Page.tsx
      throw error;
    }
  },

  // 3. REMOVER INTEGRANTE
  async deletarFuncionario(id: number) {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erro Supabase (Delete):", error.message);
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Erro ao deletar funcionário:", error);
      throw error;
    }
  }
};