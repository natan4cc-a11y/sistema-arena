"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Venda {
  id: number;
  data_venda: string;
  cliente: string;
  total: number;
  itens: Record<string, unknown>[]; // Corrigido de 'any' para um tipo mais aceitável
}

export default function Relatorios() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [totalDia, setTotalDia] = useState(0);

  useEffect(() => {
    async function carregarVendas() {
      const { data } = await supabase
        .from('vendas')
        .select('*')
        .order('data_venda', { ascending: false })
        .limit(50);

      if (data) {
        setVendas(data);
        const soma = data.reduce((acc, venda) => acc + venda.total, 0);
        setTotalDia(soma);
      }
    }
    carregarVendas();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100 border-t-4 border-green-600">
      
      {/* Cabeçalho */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-700 group">
            <ArrowLeft className="text-green-500 group-hover:-translate-x-1 transition" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-amber-50 flex items-center gap-2 uppercase tracking-tight">
              <TrendingUp className="text-green-500" /> Financeiro
            </h1>
            <p className="text-slate-400">Histórico de Vendas</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Card do Total */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 rounded-2xl p-8 text-white shadow-[0_0_30px_rgba(34,197,94,0.2)] flex items-center justify-between border border-green-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl -mr-10 -mt-20"></div>
          <div className="relative z-10">
            <p className="text-green-100 text-lg mb-1 font-medium">Faturamento (Últimas 50)</p>
            <h2 className="text-5xl font-black tracking-tighter text-white">R$ {totalDia.toFixed(2)}</h2>
          </div>
          <div className="bg-green-900/40 p-4 rounded-full border border-green-500/30 relative z-10">
            <DollarSign size={48} className="text-green-300"/>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="p-4 bg-slate-950/50 font-bold text-slate-400 border-b border-slate-700 uppercase tracking-wider text-sm">
            Últimas Transações
          </div>
          
          <div className="divide-y divide-slate-700/50">
            {vendas.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p>Nenhuma venda registrada.</p>
              </div>
            ) : (
              vendas.map((venda) => (
                <div key={venda.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-200 text-lg">{venda.cliente}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 uppercase tracking-wide">
                      <Calendar size={12}/> {new Date(venda.data_venda).toLocaleString('pt-BR')}
                    </span>
                    <div className="text-xs text-slate-400 mt-1 italic">
                      {venda.itens?.length || 0} itens
                    </div>
                  </div>
                  <div className="text-green-400 font-black text-xl bg-green-900/20 px-3 py-1 rounded-lg border border-green-900/50">
                    + R$ {venda.total.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}