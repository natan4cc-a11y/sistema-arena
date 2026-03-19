"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, UtensilsCrossed, TrendingUp, ChefHat, LogOut } from 'lucide-react';

interface Funcionario {
  id: number;
  nome_completo: string;
  cargo: string;
  senha?: string;
}

export default function Home() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<Funcionario | null>(null);
  const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState('');
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  useEffect(() => {
    const inicializar = async () => {
      const salvo = localStorage.getItem('usuario_arena');
      if (salvo) setUsuarioLogado(JSON.parse(salvo));
      const { data } = await supabase.from('funcionarios').select('*');
      if (data) setFuncionarios(data);
    };
    inicializar();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const func = funcionarios.find(f => f.id.toString() === usuarioSelecionadoId);
    if (!func) { setErroLogin('SELECIONE UM FUNCIONÁRIO!'); return; }
    if (func.senha === senhaDigitada) {
      setUsuarioLogado(func);
      localStorage.setItem('usuario_arena', JSON.stringify(func));
      setErroLogin('');
    } else { setErroLogin('SENHA INCORRETA!'); }
  }

  function handleLogout() {
    setUsuarioLogado(null);
    localStorage.removeItem('usuario_arena');
  }

  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 border-t-8 border-[#f97316]">
        <div className="bg-[#1a1a1a] p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center border border-white/5">
          <div className="w-24 h-24 bg-[#EAE4D3] rounded-[2rem] flex items-center justify-center mx-auto mb-8 relative overflow-hidden">
             <Image src="/logo-arena.png" alt="Arena Logo" fill className="object-contain p-2" priority />
          </div>
          <h1 className="text-4xl font-black text-[#EAE4D3] mb-8 uppercase italic tracking-tighter">Arena Bar</h1>
          <form onSubmit={handleLogin} className="space-y-5">
            <select className="w-full p-5 border border-white/10 rounded-2xl bg-black text-[#EAE4D3] text-sm font-black focus:border-[#f97316] outline-none text-center appearance-none"
              value={usuarioSelecionadoId} onChange={(e) => setUsuarioSelecionadoId(e.target.value)}>
              <option value="">QUEM ESTÁ ENTRANDO?</option>
              {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome_completo.toUpperCase()}</option>)}
            </select>
            <input type="password" placeholder="••••••" className="w-full p-5 border border-white/10 rounded-2xl bg-black text-[#EAE4D3] text-2xl text-center tracking-[0.5em] focus:border-[#f97316] outline-none"
              value={senhaDigitada} onChange={(e) => setSenhaDigitada(e.target.value)} />
            {erroLogin && <p className="text-red-500 text-[10px] font-black uppercase">{erroLogin}</p>}
            <button type="submit" className="w-full bg-[#f97316] text-white p-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#ea580c] transition active:scale-95">ENTRAR EM CAMPO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#EAE4D3] rounded-xl relative overflow-hidden">
            <Image src="/logo-arena.png" alt="Logo" fill className="object-contain p-1" />
          </div>
          <h1 className="font-black italic text-xl uppercase">ARENA <span className="text-[#f97316]">BAR</span></h1>
        </div>
        <button onClick={handleLogout} className="text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 italic">
          <LogOut size={14} /> Sair
        </button>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {(usuarioLogado.cargo === 'Garçom' || usuarioLogado.cargo === 'Caixa/Admin') && (
          <Link href="/mesas" className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-white/5 hover:border-[#f97316]/50 transition-all flex flex-col items-center gap-4 shadow-xl">
            <div className="bg-[#f97316]/10 p-5 rounded-3xl text-[#f97316]"><LayoutDashboard size={32} /></div>
            <span className="font-black italic text-xl uppercase">Mapa de Mesas</span>
          </Link>
        )}
        {(usuarioLogado.cargo === 'Cozinha' || usuarioLogado.cargo === 'Caixa/Admin') && (
          <Link href="/cozinha" className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-white/5 hover:border-red-500/50 transition-all flex flex-col items-center gap-4 shadow-xl">
            <div className="bg-red-500/10 p-5 rounded-3xl text-red-500"><ChefHat size={32} /></div>
            <span className="font-black italic text-xl uppercase">Cozinha</span>
          </Link>
        )}
        {usuarioLogado.cargo === 'Caixa/Admin' && (
          <>
            <Link href="/cardapio" className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-white/5 hover:border-amber-500/50 transition-all flex flex-col items-center gap-4 shadow-xl">
              <div className="bg-amber-500/10 p-5 rounded-3xl text-amber-500"><UtensilsCrossed size={32} /></div>
              <span className="font-black italic text-xl uppercase">Cardápio</span>
            </Link>
            <Link href="/relatorios" className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-white/5 hover:border-green-500/50 transition-all flex flex-col items-center gap-4 shadow-xl">
              <div className="bg-green-500/10 p-5 rounded-3xl text-green-500"><TrendingUp size={32} /></div>
              <span className="font-black italic text-xl uppercase">Financeiro</span>
            </Link>
            <Link href="/cadastro" className="bg-[#1a1a1a] p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-500/50 transition-all flex flex-col items-center gap-4 shadow-xl">
              <div className="bg-blue-500/10 p-5 rounded-3xl text-blue-500"><Users size={32} /></div>
              <span className="font-black italic text-xl uppercase">Equipe</span>
            </Link>
          </>
        )}
      </main>
      <footer className="mt-20 opacity-10 text-[9px] font-black tracking-[0.5em]">ARENA BAR • PATOS, PB</footer>
    </div>
  );
}