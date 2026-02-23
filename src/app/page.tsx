"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, UtensilsCrossed, Beer, TrendingUp, ChefHat, LogOut } from 'lucide-react';

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

    if (!func) {
      setErroLogin('Selecione um funcionário!');
      return;
    }

    if (func.senha === senhaDigitada) {
      setUsuarioLogado(func);
      localStorage.setItem('usuario_arena', JSON.stringify(func));
      setErroLogin('');
    } else {
      setErroLogin('Senha incorreta!');
    }
  }

  function handleLogout() {
    setUsuarioLogado(null);
    localStorage.removeItem('usuario_arena');
    setSenhaDigitada('');
    setUsuarioSelecionadoId('');
  }

  // TELA DE LOGIN
  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 border-t-4 border-amber-500">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-slate-700">
          <div className="bg-amber-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
            <Beer className="text-slate-900" size={40} />
          </div>
          <h1 className="text-3xl font-black text-amber-50 mb-2 uppercase tracking-wide">Arena Bar</h1>
          <p className="text-slate-400 mb-8">Acesso ao Sistema</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <select 
              className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 text-lg focus:border-amber-500 outline-none"
              value={usuarioSelecionadoId}
              onChange={(e) => setUsuarioSelecionadoId(e.target.value)}
            >
              <option value="">Selecione seu nome...</option>
              {funcionarios.map(f => (
                <option key={f.id} value={f.id}>{f.nome_completo}</option>
              ))}
            </select>

            <input 
              type="password" 
              placeholder="Senha"
              className="w-full p-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 text-lg text-center tracking-widest focus:border-amber-500 outline-none"
              value={senhaDigitada}
              onChange={(e) => setSenhaDigitada(e.target.value)}
            />

            {erroLogin && <p className="text-red-400 font-bold">{erroLogin}</p>}

            <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-500 text-lg shadow-lg transition transform hover:scale-105">
              ENTRAR EM CAMPO
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD PRINCIPAL
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 border-t-4 border-green-600">
      <div className="text-center mb-8 relative w-full max-w-6xl">
        <div className="absolute top-0 right-0">
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
                <LogOut size={20}/> SAIR
            </button>
        </div>
        
        <div className="flex flex-col items-center">
            <div className="bg-amber-500 p-4 rounded-full mb-4 shadow-[0_0_20px_rgba(245,158,11,0.4)] border-4 border-slate-800">
                <Beer className="text-slate-900" size={48} />
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-amber-50 tracking-tighter drop-shadow-lg">
            ARENA
            </h1>
            <div className="bg-green-700 text-amber-100 px-6 py-1 rounded-full text-sm font-bold tracking-widest uppercase shadow-md -mt-2 border-2 border-amber-500 z-10">
                Bar e Petiscaria
            </div>
        </div>

        <p className="text-slate-500 mt-6 text-lg">
            Bem-vindo, <span className="text-amber-500 font-bold">{usuarioLogado.nome_completo.split(' ')[0]}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        
        {(usuarioLogado.cargo === 'Garçom' || usuarioLogado.cargo === 'Caixa/Admin') && (
            <Link href="/mesas" className="group bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-amber-500 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] flex flex-col items-center text-center gap-4">
            <div className="bg-amber-500/10 p-4 rounded-full group-hover:bg-amber-500 transition-colors">
                <LayoutDashboard size={32} className="text-amber-500 group-hover:text-slate-900" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-amber-50">Mapa de Mesas</h2>
                <p className="text-sm text-slate-400">Atendimento</p>
            </div>
            </Link>
        )}

        {(usuarioLogado.cargo === 'Cozinha' || usuarioLogado.cargo === 'Caixa/Admin') && (
            <Link href="/cozinha" className="group bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-red-500 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] flex flex-col items-center text-center gap-4">
            <div className="bg-red-500/10 p-4 rounded-full group-hover:bg-red-500 transition-colors">
                <ChefHat size={32} className="text-red-500 group-hover:text-slate-900" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-amber-50">Cozinha</h2>
                <p className="text-sm text-slate-400">Pedidos Pendentes</p>
            </div>
            </Link>
        )}

        {usuarioLogado.cargo === 'Caixa/Admin' && (
            <Link href="/cardapio" className="group bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-slate-400 transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="bg-slate-700 p-4 rounded-full group-hover:bg-slate-200 transition-colors">
                <UtensilsCrossed size={32} className="text-slate-200 group-hover:text-slate-900" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-amber-50">Cardápio</h2>
                <p className="text-sm text-slate-400">Gerenciar Preços</p>
            </div>
            </Link>
        )}

        {usuarioLogado.cargo === 'Caixa/Admin' && (
            <Link href="/relatorios" className="group bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-green-500 transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] flex flex-col items-center text-center gap-4">
            <div className="bg-green-500/10 p-4 rounded-full group-hover:bg-green-500 transition-colors">
                <TrendingUp size={32} className="text-green-500 group-hover:text-slate-900" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-amber-50">Financeiro</h2>
                <p className="text-sm text-slate-400">Ver Lucros</p>
            </div>
            </Link>
        )}

        {usuarioLogado.cargo === 'Caixa/Admin' && (
            <Link href="/cadastro" className="group bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-blue-500 transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="bg-blue-500/10 p-4 rounded-full group-hover:bg-blue-500 transition-colors">
                <Users size={32} className="text-blue-500 group-hover:text-slate-900" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-amber-50">Equipe</h2>
                <p className="text-sm text-slate-400">Cadastrar Pessoas</p>
            </div>
            </Link>
        )}
      </div>
      
      <div className="mt-12 text-slate-600 text-sm">
        Sistema Arena © 2025
      </div>
    </div>
  );
}