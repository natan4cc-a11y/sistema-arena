"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ChefHat, Clock, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Pedido {
  id: number;
  id_mesa: number;
  nome_produto: string;
  horario: string;
  status: string;
  observacao?: string;
}

export default function TelaCozinha() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos_mesa')
      .select('*')
      .eq('status', 'pendente') 
      .order('horario', { ascending: true });
    if (data) setPedidos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Definimos uma função assíncrona interna para evitar o erro de cascading render
    const inicializarCozinha = async () => {
      await fetchPedidos();
    };

    inicializarCozinha();
    
    const intervalo = setInterval(() => {
      fetchPedidos();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [fetchPedidos]);

  async function marcarComoPronto(id: number) {
    setPedidos(current => current.filter(p => p.id !== id));
    await supabase.from('pedidos_mesa').update({ status: 'pronto' }).eq('id', id);
    fetchPedidos();
  }

  const pedidosPorMesa = pedidos.reduce((acc: Record<number, Pedido[]>, pedido) => {
    if (!acc[pedido.id_mesa]) acc[pedido.id_mesa] = [];
    acc[pedido.id_mesa].push(pedido);
    return acc;
  }, {} as Record<number, Pedido[]>);

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-slate-100 border-t-4 border-amber-500">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-700 transition">
            <ArrowLeft className="text-amber-500" />
          </Link>
          <h1 className="text-3xl font-black text-amber-50 flex items-center gap-2 uppercase tracking-tighter"><ChefHat className="text-amber-500" /> COZINHA ARENA</h1>
        </div>
        <button onClick={fetchPedidos} className="p-3 bg-amber-500 text-slate-900 rounded-lg hover:scale-105 transition font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]"><RefreshCw size={24} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Object.keys(pedidosPorMesa).length === 0 && !loading ? (
           <div className="col-span-full text-center py-20 opacity-30 flex flex-col items-center">
             <ChefHat size={80} className="mb-4 text-slate-500"/>
             <p className="text-2xl font-bold text-slate-500 uppercase">Sem pedidos no momento</p>
           </div>
        ) : (
          Object.keys(pedidosPorMesa).map((mesaId) => (
            <div key={mesaId} className="bg-slate-800 rounded-xl border-t-4 border-amber-500 shadow-xl overflow-hidden">
              <div className="bg-slate-950 p-4 flex justify-between items-center border-b border-slate-700">
                <h2 className="text-2xl font-black text-amber-50 font-bold uppercase">MESA {mesaId}</h2>
                <Clock size={20} className="text-amber-500 animate-pulse" />
              </div>
              <div className="p-4 space-y-4">
                {pedidosPorMesa[Number(mesaId)].map((item) => (
                  <div key={item.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-amber-50 uppercase tracking-tight">{item.nome_produto}</span>
                      <button onClick={() => marcarComoPronto(item.id)} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg shadow-lg transition"><CheckCircle size={22} /></button>
                    </div>
                    {item.observacao && (
                      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-2 rounded">
                        <p className="text-xs text-amber-500 font-black uppercase italic">Atenção: {item.observacao}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}