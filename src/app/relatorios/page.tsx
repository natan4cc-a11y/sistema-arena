"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, TrendingUp, DollarSign, Package, ChevronRight, AlertCircle } from 'lucide-react';

interface ItemVenda {
  nome_produto: string;
  preco: number;
}

interface Venda {
  id: number;
  created_at: string;
  cliente: string;
  total: number;
  itens: ItemVenda[];
}

export default function RelatoriosPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('hoje');
  const [erro, setErro] = useState<string | null>(null);

  const buscarVendas = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);
      
      let query = supabase.from('vendas').select('*');
      const agora = new Date();
      const dataInicio = new Date();

      if (periodo === 'hoje') {
        dataInicio.setHours(0, 0, 0, 0);
        query = query.gte('created_at', dataInicio.toISOString());
      } else if (periodo === 'semana') {
        dataInicio.setDate(agora.getDate() - 7);
        query = query.gte('created_at', dataInicio.toISOString());
      } else if (periodo === 'mes') {
        dataInicio.setMonth(agora.getMonth() - 1);
        query = query.gte('created_at', dataInicio.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setVendas((data as Venda[]) || []);

    } catch (err: unknown) {
      // 🌟 CORREÇÃO: Removido o 'any' e adicionado tratamento seguro de erro
      const msg = err instanceof Error ? err.message : "Erro desconhecido no banco";
      console.error("Erro Arena Financeiro:", msg);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    buscarVendas();
  }, [buscarVendas]);

  const totalFaturado = vendas.reduce((acc, v) => acc + (v.total || 0), 0);
  const ticketMedio = vendas.length > 0 ? totalFaturado / vendas.length : 0;

  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none text-white">FINANCEIRO <span className="text-[#f97316]">ARENA</span></h1>
            <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1">Gestão de Caixa • Patos, PB</p>
          </div>
        </div>
        <div className="flex bg-[#1a1a1a] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
            {(['hoje', 'semana', 'mes', 'todos'] as const).map((p) => (
                <button key={p} onClick={() => setPeriodo(p)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase ${periodo === p ? 'bg-[#f97316] text-white' : 'text-white/40 hover:text-white'}`}>{p}</button>
            ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {erro && (
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-[2rem] flex items-center gap-4 text-red-500 italic font-black uppercase text-xs tracking-widest">
            <AlertCircle size={24} /> Erro: {erro}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5">
            <DollarSign size={24} className="text-green-500 mb-4" />
            <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-1 italic">Faturamento</p>
            <h2 className="text-4xl font-black italic">R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5">
            <TrendingUp size={24} className="text-[#f97316] mb-4" />
            <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-1 italic">Ticket Médio</p>
            <h2 className="text-4xl font-black italic">R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5">
            <Package size={24} className="text-blue-500 mb-4" />
            <p className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-1 italic">Vendas</p>
            <h2 className="text-4xl font-black italic">{vendas.length}</h2>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-[3rem] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black uppercase opacity-20 tracking-[0.3em] border-b border-white/5 bg-black/20 italic">
                  <th className="p-8">Data/Hora</th>
                  <th className="p-8">Cliente</th>
                  <th className="p-8 text-right">Faturamento</th>
                  <th className="p-8 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                   <tr><td colSpan={4} className="p-20 text-center opacity-20 font-black uppercase tracking-widest animate-pulse italic">Carregando Arena...</td></tr>
                ) : (
                  vendas.map((venda) => (
                    <tr key={venda.id} className="hover:bg-white/[0.02] transition group">
                      <td className="p-8 text-xs font-bold opacity-60">
                        {new Date(venda.created_at).toLocaleDateString('pt-BR')} 
                        <span className="opacity-30 ml-2 font-normal text-[10px]">{new Date(venda.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="p-8 font-black uppercase italic text-sm">{venda.cliente || 'CONSUMIDOR'}</td>
                      <td className="p-8 text-right font-black text-[#f97316] text-lg italic tracking-tighter">R$ {venda.total.toFixed(2)}</td>
                      <td className="p-8 text-center">
                        <button className="p-2 bg-black rounded-xl border border-white/10 hover:border-[#f97316] transition group">
                            <ChevronRight size={16} className="text-white/20 group-hover:text-[#f97316]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}