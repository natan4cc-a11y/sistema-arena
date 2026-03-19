"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
// Removido Trash2 que não estava sendo usado
import { ArrowLeft, Plus, Edit3, Package, Search, X, Save, Minus } from 'lucide-react';

interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  estoque_atual: number;
}

export default function CardapioPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setProdutos(data as Produto[]);
    } catch (err) {
      console.error("Erro ao carregar cardápio:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let montado = true;
    if (montado) {
      carregarProdutos();
    }
    return () => { montado = false; };
  }, [carregarProdutos]);

  // AJUSTE RÁPIDO DE ESTOQUE
  async function ajustarEstoqueRapido(id: number, quantidadeAtual: number, delta: number) {
    const novaQuantidade = Math.max(0, quantidadeAtual + delta);
    
    // Atualização otimista (muda na tela na hora)
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, estoque_atual: novaQuantidade } : p));

    const { error } = await supabase
      .from('produtos')
      .update({ estoque_atual: novaQuantidade })
      .eq('id', id);

    if (error) {
      console.error("Erro ao ajustar estoque:", error);
      carregarProdutos(); 
    }
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoEditando) return;

    try {
      const { error } = await supabase
        .from('produtos')
        .update({
          nome: produtoEditando.nome,
          preco: produtoEditando.preco,
          estoque_atual: produtoEditando.estoque_atual
        })
        .eq('id', produtoEditando.id);

      if (error) throw error;
      
      setProdutoEditando(null);
      carregarProdutos();
    } catch (err) {
      console.error("Erro ao atualizar produto:", err);
      alert("Erro ao salvar as alterações.");
    }
  }

  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none text-white">GESTÃO DE <span className="text-[#f97316]">CARDÁPIO</span></h1>
            <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1">Arena Bar • Estoque e Preços</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR NO ARENA..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 py-3 pl-12 pr-6 rounded-2xl text-xs font-black focus:border-[#f97316] outline-none w-full md:w-64 transition text-white"
            />
          </div>
          <button className="bg-[#f97316] text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:bg-[#ea580c] transition shadow-lg shadow-orange-950/20 uppercase">
            Novo Item
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 opacity-20 font-black uppercase tracking-[0.5em] animate-pulse italic text-xl">Sincronizando...</div>
        ) : (
          produtosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 group hover:border-[#f97316]/30 transition-all shadow-2xl">
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black uppercase opacity-20 tracking-widest">{prod.categoria}</span>
                <button 
                  onClick={() => setProdutoEditando(prod)}
                  className="p-2 bg-black rounded-xl text-white/40 hover:text-[#f97316] transition border border-white/5"
                >
                  <Edit3 size={16} />
                </button>
              </div>

              <h3 className="text-xl font-black uppercase italic mb-1 text-white truncate">{prod.nome}</h3>
              <p className="text-2xl font-black text-[#f97316] italic mb-6">R$ {prod.preco.toFixed(2)}</p>

              <div className="flex items-center justify-between pt-6 border-t border-white/5 bg-black/20 p-4 rounded-3xl">
                <div className="flex items-center gap-3">
                    <Package size={18} className={prod.estoque_atual < 5 ? 'text-red-500' : 'text-white/20'} />
                    <div>
                        <p className="text-[8px] font-black uppercase opacity-30">Estoque</p>
                        <p className={`font-black text-sm ${prod.estoque_atual < 5 ? 'text-red-500' : 'text-white'}`}>{prod.estoque_atual}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => ajustarEstoqueRapido(prod.id, prod.estoque_atual, -1)}
                        className="w-10 h-10 bg-black rounded-xl border border-white/5 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition active:scale-90"
                    >
                        <Minus size={16} />
                    </button>
                    <button 
                        onClick={() => ajustarEstoqueRapido(prod.id, prod.estoque_atual, 1)}
                        className="w-10 h-10 bg-black rounded-xl border border-white/5 flex items-center justify-center hover:bg-green-500/20 hover:text-green-500 transition active:scale-90"
                    >
                        <Plus size={16} />
                    </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {produtoEditando && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[3rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase italic text-white">EDITAR <span className="text-[#f97316]">ITEM</span></h2>
              <button onClick={() => setProdutoEditando(null)} className="p-2 text-white/20 hover:text-red-500 transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2 block">Nome</label>
                <input 
                  type="text" 
                  value={produtoEditando.nome}
                  onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value})}
                  className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-[#f97316] transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2 block">Preço (R$)</label>
                  <input 
                    type="number" step="0.01"
                    value={produtoEditando.preco}
                    onChange={(e) => setProdutoEditando({...produtoEditando, preco: parseFloat(e.target.value)})}
                    className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2 block">Estoque</label>
                  <input 
                    type="number"
                    value={produtoEditando.estoque_atual}
                    onChange={(e) => setProdutoEditando({...produtoEditando, estoque_atual: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 p-4 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#f97316] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#ea580c] transition shadow-xl active:scale-95">
                <Save size={18} /> Gravar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-20 opacity-10 text-[9px] font-black tracking-[1em] text-center uppercase pb-10">
        Arena Bar • Patos PB
      </footer>
    </div>
  );
}