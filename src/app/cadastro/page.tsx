"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Trash2, Shield, ArrowLeft, UserPlus, Lock } from 'lucide-react';
import Link from 'next/link';

// Mantendo suas importações originais
import { cadastroService } from '../../services/cadastroService';
import { Funcionario } from '../../types';

export default function CadastroEquipe() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('Garçom');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(true);

  // BUSCANDO OS DADOS
  const atualizarLista = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await cadastroService.getFuncionarios();
      setFuncionarios(dados);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao carregar equipe:", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    atualizarLista();
  }, [atualizarLista]);

  // FUNÇÃO DE CADASTRO CORRIGIDA
  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !senha) {
        alert("Preencha o nome e a senha!");
        return;
    }
    
    try {
      // 🧐 Verifique se no seu 'cadastroService' os argumentos estão nessa ordem!
      await cadastroService.cadastrarFuncionario(nome, cargo, senha);
      
      setNome(''); 
      setSenha(''); 
      await atualizarLista(); 
      alert('✅ Funcionário cadastrado com sucesso na Arena!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      alert("Erro ao cadastrar: " + msg);
    }
  }

  async function handleDeletar(id: number) {
    if(!confirm("Remover este integrante da equipe?")) return;
    
    try {
      await cadastroService.deletarFuncionario(id);
      atualizarLista(); 
    } catch {
      alert("Erro ao deletar.");
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5 shadow-xl">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none text-white flex items-center gap-3">
              EQUIPE <span className="text-[#f97316]">ARENA</span>
            </h1>
            <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1">Gestão de Acessos e Funcionários</p>
          </div>
        </header>

        <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl mb-12">
            <h2 className="text-sm font-black uppercase italic text-[#f97316] mb-6 tracking-widest flex items-center gap-2">
               <UserPlus size={18} /> Novo Integrante
            </h2>
            
            <form onSubmit={handleCadastro} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase opacity-30 tracking-widest block mb-2">Nome Completo</label>
                    <input 
                      value={nome} 
                      onChange={e => setNome(e.target.value.toUpperCase())} 
                      placeholder="NOME DO MEMBRO"
                      className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-bold focus:border-[#f97316] outline-none transition uppercase text-xs"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase opacity-30 tracking-widest block mb-2">Função</label>
                    <select 
                      value={cargo} 
                      onChange={e => setCargo(e.target.value)} 
                      className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-bold focus:border-[#f97316] outline-none transition text-xs appearance-none cursor-pointer"
                    >
                        <option value="Garçom">Garçom</option>
                        <option value="Cozinha">Cozinha</option>
                        <option value="Caixa/Admin">Caixa/Admin</option>
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className="text-[10px] font-black uppercase opacity-30 tracking-widest block mb-2 flex items-center gap-1">
                      <Lock size={12} /> Senha de Acesso
                    </label>
                    <input 
                      type="password" 
                      value={senha} 
                      onChange={e => setSenha(e.target.value)} 
                      placeholder="****"
                      className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-bold focus:border-[#f97316] outline-none transition text-xs"
                    />
                </div>
                <button 
                  type="submit" 
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white font-black p-4 rounded-2xl transition shadow-lg shadow-orange-900/20 uppercase text-xs tracking-widest active:scale-95"
                >
                    CADASTRAR
                </button>
            </form>
        </div>

        <h2 className="text-[10px] font-black uppercase opacity-20 mb-4 tracking-[0.4em] px-4">Integrantes Atuais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-10 opacity-20 font-black uppercase tracking-widest animate-pulse italic">Carregando Staff...</div>
            ) : (
              funcionarios.map(f => (
                <div key={f.id} className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/5 flex justify-between items-center group hover:border-[#f97316]/30 transition-all shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${f.cargo === 'Caixa/Admin' ? 'bg-[#f97316]/10 text-[#f97316]' : 'bg-white/5 text-white/40'}`}>
                            {f.cargo === 'Caixa/Admin' ? <Shield size={24}/> : <Users size={24}/>}
                        </div>
                        <div>
                           <p className="font-black text-white uppercase italic text-sm">{f.nome_completo}</p>
                            <p className="text-[9px] text-[#f97316] font-black uppercase tracking-widest mt-1 opacity-60">{f.cargo}</p>
                        </div>
                    </div>
                    <button 
                      onClick={() => handleDeletar(f.id)} 
                      className="text-white/10 hover:text-red-500 p-3 transition rounded-xl hover:bg-red-500/10"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
}