"use client"
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, ArrowLeft, Beer, Utensils, Search, Package } from 'lucide-react';
import Link from 'next/link';

interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: 'bebida' | 'comida';
  estoque_atual: number;
}

export default function GerenciarCardapio() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  
  const [novoNome, setNovoNome] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoEstoque, setNovoEstoque] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<'bebida' | 'comida'>('bebida');
  const [salvando, setSalvando] = useState(false);

  // Função para recarregar a lista (usada após adicionar ou deletar)
  async function recarregarLista() {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true });
    
    if (data) setProdutos(data as Produto[]);
  }

  // Efeito inicial corrigido para satisfazer o Linter
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });
      if (data) setProdutos(data as Produto[]);
    };
    init();
  }, []);

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    if (!novoNome || !novoPreco || !novoEstoque) return;
    setSalvando(true);

    const precoFormatado = parseFloat(novoPreco.replace(',', '.'));
    const estoqueFormatado = parseInt(novoEstoque);

    const { error } = await supabase.from('produtos').insert([{ 
        nome: novoNome, 
        preco: precoFormatado, 
        categoria: novaCategoria,
        estoque_atual: estoqueFormatado
      }]);

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      setNovoNome('');
      setNovoPreco('');
      setNovoEstoque('');
      recarregarLista();
    }
    setSalvando(false);
  }

  async function handleDeletar(id: number, nome: string) {
    if (!confirm(`Apagar "${nome}" do cardápio?`)) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) alert('Erro ao apagar item.');
    else recarregarLista();
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100 border-t-4 border-amber-500">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-700 group">
            <ArrowLeft className="text-amber-500 group-hover:-translate-x-1 transition" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-amber-50 uppercase tracking-tight text-amber-50">Estoque & Cardápio</h1>
            <p className="text-slate-400">Controle de Inventário Arena</p>
          </div>
        </div>

        {/* Formulário de Cadastro */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <h2 className="text-lg font-bold text-amber-50 mb-4 flex items-center gap-2">
            <Plus className="text-amber-500" /> Novo Produto
          </h2>
          <form onSubmit={handleAdicionar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-10">
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Nome do Item</label>
              <input 
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Ex: Heineken 600ml" 
                className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg text-white focus:border-amber-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Preço (R$)</label>
              <input 
                value={novoPreco}
                onChange={e => setNovoPreco(e.target.value)}
                placeholder="0,00" 
                type="number" step="0.01"
                className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg text-white focus:border-amber-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Qtd Inicial</label>
              <input 
                value={novoEstoque}
                onChange={e => setNovoEstoque(e.target.value)}
                placeholder="Ex: 24" 
                type="number"
                className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg text-white focus:border-amber-500 outline-none transition"
                required
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Categoria</label>
              <select 
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value as 'bebida' | 'comida')}
                className="w-full bg-slate-900 border border-slate-600 p-3 rounded-lg text-white focus:border-amber-500 outline-none transition"
              >
                <option value="bebida">🍺 Bebida</option>
                <option value="comida">🍖 Comida</option>
              </select>
            </div>
            <button 
              disabled={salvando}
              type="submit" 
              className="md:col-span-4 bg-amber-500 text-slate-900 py-3 rounded-lg font-black hover:bg-amber-400 transition shadow-lg shadow-amber-900/20 uppercase tracking-widest"
            >
              {salvando ? 'PROCESSANDO...' : 'CADASTRAR NO SISTEMA'}
            </button>
          </form>
        </div>

        {/* Lista de Produtos e Estoque */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/50 font-bold text-slate-400 flex justify-between items-center text-sm uppercase tracking-wider border-b border-slate-700">
            <span>Inventário Atual ({produtos.length} itens)</span>
            <Search size={16}/>
          </div>

          <div className="divide-y divide-slate-700/50 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {produtos.map(prod => (
                <div key={prod.id} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${prod.categoria === 'bebida' ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-400'}`}>
                      {prod.categoria === 'bebida' ? <Beer size={20}/> : <Utensils size={20}/>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-200 text-lg group-hover:text-amber-50 transition">{prod.nome}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Package size={12} className="text-slate-500" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${prod.estoque_atual < 10 ? 'text-red-400 animate-pulse' : 'text-green-500'}`}>
                          Estoque: {prod.estoque_atual}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-green-400 text-xl">R$ {prod.preco.toFixed(2)}</span>
                    <button 
                      onClick={() => handleDeletar(prod.id, prod.nome)}
                      className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}