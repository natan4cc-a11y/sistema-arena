"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Trash2, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Funcionario {
  id: number;
  nome_completo: string;
  cargo: string;
  senha?: string;
}

export default function CadastroEquipe() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Garçom');
  const [senha, setSenha] = useState('');

  // Função auxiliar para os BOTÕES (Salvar/Excluir) chamarem
  async function atualizarLista() {
    const { data } = await supabase.from('funcionarios').select('*');
    if (data) setFuncionarios(data);
  }

  // Efeito Inicial: Carrega os dados assim que a tela abre
  // Definimos a função AQUI DENTRO para o ESLint não reclamar de dependências externas
  useEffect(() => {
    const carregarInicial = async () => {
      const { data } = await supabase.from('funcionarios').select('*');
      if (data) setFuncionarios(data);
    };
    
    carregarInicial();
  }, []);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !senha) return;
    
    await supabase.from('funcionarios').insert([{ nome_completo: nome, cargo, senha }]);
    setNome(''); setSenha(''); 
    
    atualizarLista(); // Chama a função de atualização
    alert('Funcionário cadastrado!');
  }

  async function handleDeletar(id: number) {
    if(!confirm("Remover este funcionário?")) return;
    await supabase.from('funcionarios').delete().eq('id', id);
    
    atualizarLista(); // Chama a função de atualização
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100 border-t-4 border-amber-500">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-700 group">
            <ArrowLeft className="text-amber-500 group-hover:-translate-x-1 transition" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-amber-50 flex items-center gap-2 uppercase tracking-tight">
              <Users className="text-amber-500" /> Equipe Arena
            </h1>
            <p className="text-slate-400">Gestão de Funcionários</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8">
            <h2 className="text-lg font-bold text-amber-50 mb-4">Novo Membro</h2>
            <form onSubmit={handleCadastro} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Nome</label>
                    <input value={nome} onChange={e=>setNome(e.target.value)} className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg focus:border-amber-500 outline-none text-white"/>
                </div>
                <div className="md:col-span-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Cargo</label>
                    <select value={cargo} onChange={e=>setCargo(e.target.value)} className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg focus:border-amber-500 outline-none text-white">
                        <option>Garçom</option>
                        <option>Cozinha</option>
                        <option>Caixa/Admin</option>
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Senha</label>
                    <input type="text" value={senha} onChange={e=>setSenha(e.target.value)} className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg focus:border-amber-500 outline-none text-white"/>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg transition h-full shadow-lg">
                    CADASTRAR
                </button>
            </form>
        </div>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funcionarios.map(f => (
                <div key={f.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center group hover:border-amber-500/50 transition">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${f.cargo === 'Caixa/Admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-400'}`}>
                            {f.cargo === 'Caixa/Admin' ? <Shield size={20}/> : <Users size={20}/>}
                        </div>
                        <div>
                            <p className="font-bold text-slate-200">{f.nome_completo}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">{f.cargo}</p>
                        </div>
                    </div>
                    <button onClick={() => handleDeletar(f.id)} className="text-slate-600 hover:text-red-500 p-2 transition">
                        <Trash2 size={20} />
                    </button>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
}