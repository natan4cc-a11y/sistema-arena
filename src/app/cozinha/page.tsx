"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, CheckCircle2, RotateCcw, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';

// IMPORTANDO DO ARQUIVO CENTRAL E DO SEU SERVICE:
import { PedidoCozinha } from '@/types';
import { cozinhaService } from '@/services/cozinhaService';

export default function CozinhaPage() {
  const [pedidos, setPedidos] = useState<PedidoCozinha[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      // Puxando do Service
      const data = await cozinhaService.buscarPedidosPendentes();
      setPedidos(data);
    } catch (error) {
      console.error("Erro Cozinha:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPedidos();
    
    // Liga o Radar pelo Service
    const channel = cozinhaService.inscreverAtualizacoes(() => {
        carregarPedidos();
    });

    // Desliga o Radar ao fechar a página
    return () => { 
        cozinhaService.removerInscricao(channel); 
    };
  }, [carregarPedidos]);

  async function finalizarPedido(id: number) {
    try {
        // Usa o Service para marcar como pronto
        await cozinhaService.marcarComoPronto(id);
        carregarPedidos();
    } catch  {
        alert("Erro ao finalizar. Tente de novo.");
    }
  }

  // O VISUAL (HTML/JSX) CONTINUA EXATAMENTE O MESMO QUE VOCÊ FEZ!
  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-3">
             <ChefHat size={32} className="text-[#f97316]" />
             <div>
                <h1 className="text-2xl font-black uppercase italic leading-none">ARENA <span className="text-[#f97316]">COZINHA</span></h1>
                <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1">Pedidos em Tempo Real • Patos</p>
             </div>
          </div>
        </div>
        <button onClick={carregarPedidos} className="p-3 bg-[#1a1a1a] text-[#f97316] rounded-2xl hover:rotate-180 transition-all duration-500 border border-white/5">
            <RotateCcw size={20} />
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest animate-pulse italic">CHEF PREPARANDO...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center opacity-10">
            <UtensilsCrossed size={64} />
            <p className="mt-4 font-black uppercase tracking-[0.5em]">Nenhum pedido pendente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-[#1a1a1a] border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-4 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <span className="bg-[#f97316] text-black px-4 py-1 rounded-full text-xs font-black italic">MESA {pedido.id_mesa}</span>
                  <div className="flex items-center gap-1 text-white/20 text-[10px] font-bold">
                    <Clock size={12} /> {new Date(pedido.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase italic text-white mb-2">{pedido.nome_produto}</h3>
                  {pedido.observacao && (
                    <div className="bg-black/40 p-3 rounded-2xl border border-[#f97316]/20">
                      <p className="text-[10px] text-[#f97316] font-bold uppercase tracking-widest italic">Obs: {pedido.observacao}</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => finalizarPedido(pedido.id)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition active:scale-95 shadow-lg"
                >
                  <CheckCircle2 size={16} /> Finalizar Pedido
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}