"use client"
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit3, Package, Search, X, Save, Plus, Minus } from 'lucide-react';

// IMPORTANDO DO ARQUIVO CENTRAL E DO SERVICE:
import { Produto } from '@/types';
import { cardapioService } from '@/services/cardapioService';

export default function CardapioPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalNovoItem, setModalNovoItem] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    preco: 0,
    categoria: 'bebida' as Produto['categoria'],
    estoque_atual: 0
  });

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cardapioService.getProdutos();
      setProdutos(data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  async function handleCadastrarProduto(e: React.FormEvent) {
    e.preventDefault();
    try {
      await cardapioService.adicionarProduto(
        novoProduto.nome, 
        novoProduto.preco, 
        novoProduto.categoria, 
        novoProduto.estoque_atual
      );

      setModalNovoItem(false);
      setNovoProduto({ nome: '', preco: 0, categoria: 'bebida', estoque_atual: 0 });
      carregarProdutos();
    } catch (err) {
      alert("Erro ao cadastrar produto.");
      console.error(err);
    }
  }

  async function ajustarEstoqueRapido(id: number, atual: number, delta: number) {
    const novaQtd = Math.max(0, atual + delta);
    
    // UX: Atualiza na tela primeiro para ficar rápido
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, estoque_atual: novaQtd } : p));

    try {
      await cardapioService.atualizarEstoque(id, novaQtd);
    } catch (error) {
      console.error("Erro ao atualizar estoque no banco:", error);
      carregarProdutos(); // Se der erro no banco, volta a tela ao normal
    }
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!produtoEditando) return;

    try {
      await cardapioService.editarProduto(
        produtoEditando.id,
        produtoEditando.nome,
        produtoEditando.preco,
        produtoEditando.categoria,
        produtoEditando.estoque_atual
      );

      setProdutoEditando(null);
      carregarProdutos();
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
      alert("Erro ao editar o item.");
    }
  }

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.id.toString().includes(busca)
  );

  // O VISUAL CONTINUA INTACTO E COM A CARA DA ARENA BAR
  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase italic text-white leading-none tracking-tighter">ARENA <span className="text-[#f97316]">CARDÁPIO</span></h1>
            <p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1">Gestão de Estoque • Patos</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR ITEM..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 py-3 pl-12 pr-6 rounded-2xl text-xs font-black focus:border-[#f97316] outline-none w-full md:w-64 transition text-white placeholder:opacity-20"
            />
          </div>
          <button 
            onClick={() => setModalNovoItem(true)}
            className="bg-[#f97316] text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:scale-105 transition shadow-lg uppercase flex items-center gap-2"
          >
            <Plus size={14} /> Novo Item
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 opacity-20 font-black uppercase tracking-[0.5em] animate-pulse italic">Sincronizando...</div>
        ) : (
          produtosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 hover:border-[#f97316]/30 transition-all shadow-2xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black uppercase opacity-20 tracking-widest bg-black px-3 py-1 rounded-full border border-white/5">{prod.categoria}</span>
                <button 
                  onClick={() => setProdutoEditando(prod)}
                  className="p-2 bg-black rounded-xl text-white/40 hover:text-[#f97316] transition border border-white/5"
                >
                  <Edit3 size={16} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-[#f97316] text-[10px] font-black mb-1 opacity-50 uppercase tracking-tighter">CÓDIGO #{prod.id}</p>
                <h3 className="text-xl font-black uppercase italic text-white truncate leading-tight">{prod.nome}</h3>
                <p className="text-3xl font-black text-[#f97316] italic mt-1">R$ {prod.preco.toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5 bg-black/20 p-4 rounded-3xl mt-4">
                <div className="flex items-center gap-3">
                  <Package size={20} className={prod.estoque_atual < 5 ? 'text-red-500 animate-pulse' : 'text-white/20'} />
                  <div>
                    <p className="text-[8px] font-black uppercase opacity-30 leading-none">Qtd. Estoque</p>
                    <p className={`font-black text-lg ${prod.estoque_atual < 5 ? 'text-red-500' : 'text-white'}`}>
                      {prod.estoque_atual}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => ajustarEstoqueRapido(prod.id, prod.estoque_atual, -1)}
                    className="w-11 h-11 bg-black rounded-xl border border-white/5 flex items-center justify-center hover:text-red-500 hover:border-red-500/30 transition active:scale-90"
                  >
                    <Minus size={18} />
                  </button>
                  <button 
                    onClick={() => ajustarEstoqueRapido(prod.id, prod.estoque_atual, 1)}
                    className="w-11 h-11 bg-black rounded-xl border border-white/5 flex items-center justify-center hover:text-green-500 hover:border-green-500/30 transition active:scale-90"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* MODAL CADASTRO */}
      {modalNovoItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[3rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase italic text-white leading-none">NOVO <span className="text-[#f97316]">ITEM</span></h2>
              <button onClick={() => setModalNovoItem(false)} className="p-2 text-white/20 hover:text-red-500 transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleCadastrarProduto} className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase opacity-30 mb-2 block tracking-widest">Descrição do Produto</label>
                <input 
                  required type="text" 
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value.toUpperCase()})}
                  className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316] transition"
                  placeholder="EX: BRAHMA DUPLO MALTE"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase opacity-30 mb-2 block tracking-widest">Preço R$</label>
                  <input 
                    required type="number" step="0.01"
                    value={novoProduto.preco}
                    onChange={(e) => setNovoProduto({...novoProduto, preco: parseFloat(e.target.value)})}
                    className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase opacity-30 mb-2 block tracking-widest">Estoque Inicial</label>
                  <input 
                    required type="number"
                    value={novoProduto.estoque_atual}
                    onChange={(e) => setNovoProduto({...novoProduto, estoque_atual: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase opacity-30 mb-2 block tracking-widest">Categoria</label>
                <select 
                  value={novoProduto.categoria}
                  onChange={(e) => setNovoProduto({...novoProduto, categoria: e.target.value as Produto['categoria']})}
                  className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316] appearance-none cursor-pointer"
                >
                  <option value="bebida">BEBIDA</option>
                  <option value="comida">COMIDA</option>
                  <option value="petisco">PETISCO</option>
                  <option value="dose">DOSE</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-[#f97316] text-white p-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#ea580c] transition shadow-xl active:scale-95 mt-4">
                <Plus size={18} /> Cadastrar Produto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO */}
      {produtoEditando && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-[#111] w-full max-w-md rounded-[3rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase italic text-white">EDITAR <span className="text-[#f97316]">DADOS</span></h2>
              <button onClick={() => setProdutoEditando(null)} className="p-2 text-white/20 hover:text-red-500 transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2 block">Nome do Produto</label>
                <input 
                  type="text" 
                  value={produtoEditando.nome}
                  onChange={(e) => setProdutoEditando({...produtoEditando, nome: e.target.value.toUpperCase()})}
                  className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2 block">Preço Venda</label>
                  <input 
                    type="number" step="0.01"
                    value={produtoEditando.preco}
                    onChange={(e) => setProdutoEditando({...produtoEditando, preco: parseFloat(e.target.value)})}
                    className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2 block">Estoque</label>
                  <input 
                    type="number"
                    value={produtoEditando.estoque_atual}
                    onChange={(e) => setProdutoEditando({...produtoEditando, estoque_atual: parseInt(e.target.value)})}
                    className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-[#f97316]"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#f97316] text-white p-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#ea580c] transition shadow-xl active:scale-95 mt-4">
                <Save size={18} /> Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}