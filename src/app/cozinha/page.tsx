"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Clock, CheckCircle2, UtensilsCrossed, Timer, RotateCcw } from 'lucide-react';

interface PedidoCozinha {
  id: number;
  id_mesa: number;
  nome_produto: string;
  quantidade: number;
  observacao: string;
  horario: string;
  status_preparo: 'pendente' | 'preparando' | 'pronto';
}

export default function CozinhaPage() {
  const [pedidos, setPedidos] = useState<PedidoCozinha[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega apenas itens que não foram entregues ainda
  const carregarPedidos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_mesa')
        .select('*')
        .neq('status_preparo', 'pronto')
        .order('horario', { ascending: true });

      if (error) throw error;
      if (data) setPedidos(data);
    } catch (err) {
      console.error("Erro Cozinha:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let montado = true;
    if (montado) {
      carregarPedidos();
      
      // Realtime: Atualiza a cozinha automaticamente quando houver novo pedido
      const canal = supabase
        .channel('cozinha_arena')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_mesa' }, () => {
          carregarPedidos();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(canal);
      };
    }
    return () => { montado = false; };
  }, [carregarPedidos]);

  async function alterarStatus(id: number, novoStatus: 'preparando' | 'pronto') {
    const { error } = await supabase
      .from('pedidos_mesa')
      .update({ status_preparo: novoStatus })
      .eq('id', id);

    if (!error) carregarPedidos();
  }

  // Função para calcular há quanto tempo o pedido foi feito
  const calcularEspera = (horario: string) => {
    const inicio = new Date(horario).getTime();
    const agora = new Date().getTime();
    const minutos = Math.floor((agora - inicio) / 60000);
    return minutos;
  };

  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      
      {/* HEADER DA COZINHA */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5 shadow-xl">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">COZINHA <span className="text-[#f97316]">ARENA</span></h1>
            <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1">Controle de Produção • Tempo Real</p>
          </div>
        </div>
        <button onClick={carregarPedidos} className="p-3 bg-[#1a1a1a] text-[#f97316] rounded-2xl border border-white/5 active:rotate-180 transition-all duration-500">
            <RotateCcw size={20} />
        </button>
      </header>

      {/* GRID DE PEDIDOS */}
      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20 opacity-20 font-black uppercase tracking-[0.5em] animate-pulse">Sincronizando Pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-32 bg-[#1a1a1a] rounded-[3rem] border border-dashed border-white/10">
             <UtensilsCrossed size={48} className="mx-auto mb-4 opacity-10" />
             <p className="font-black uppercase text-xs tracking-[0.3em] opacity-20">Nenhum pedido pendente na cozinha</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidos.map((item) => (
              <div 
                key={item.id} 
                className={`bg-[#1a1a1a] p-8 rounded-[2.5rem] border transition-all flex flex-col justify-between ${
                  item.status_preparo === 'preparando' ? 'border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-white/5'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-black text-[#f97316] px-4 py-1.5 rounded-xl font-black text-xs italic">MESA {item.id_mesa}</span>
                    <div className="flex items-center gap-2 opacity-40">
                      <Timer size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{calcularEspera(item.horario)} MIN</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black uppercase italic text-white mb-2 leading-tight">{item.nome_produto}</h3>
                  
                  {item.observacao && (
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6">
                       <p className="text-[9px] font-black text-[#f97316] uppercase tracking-widest mb-1 opacity-50 italic">Observação:</p>
                       <p className="text-xs font-bold text-[#EAE4D3] uppercase">{item.observacao}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-4">
                  {item.status_preparo === 'pendente' ? (
                    <button 
                      onClick={() => alterarStatus(item.id, 'preparando')}
                      className="w-full bg-[#1a1a1a] border border-[#f97316]/30 text-[#f97316] p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#f97316] hover:text-white transition active:scale-95"
                    >
                      <Clock size={16} /> Iniciar Preparo
                    </button>
                  ) : (
                    <button 
                      onClick={() => alterarStatus(item.id, 'pronto')}
                      className="w-full bg-green-600 text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-green-500 transition shadow-lg shadow-green-900/20 active:scale-95"
                    >
                      <CheckCircle2 size={16} /> Finalizar Pedido
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-20 opacity-10 text-[9px] font-black tracking-[1em] text-center uppercase pb-10">
        Arena Bar • Cozinha Integrada
      </footer>
    </div>
  );
}