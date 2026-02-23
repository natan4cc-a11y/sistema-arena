"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, RotateCcw, X, Receipt, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; 

interface Mesa {
  id: number;
  status: 'livre' | 'ocupada' | 'conta';
  cliente: string | null;
  total: number;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: 'bebida' | 'comida';
  estoque_atual: number;
}

interface ItemPedido {
  id: number;
  nome_produto: string;
  preco: number;
  horario: string;
  observacao?: string;
}

export default function MapaMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [itensDaMesa, setItensDaMesa] = useState<ItemPedido[]>([]); 
  const [obsAtual, setObsAtual] = useState('');
  const [numPessoas, setNumPessoas] = useState(1);

  const carregarDados = useCallback(async () => {
    const { data: dadosMesas } = await supabase.from('mesas').select('*').order('id', { ascending: true });
    if (dadosMesas) setMesas(dadosMesas);
    
    const { data: dadosProdutos } = await supabase.from('produtos').select('*').order('nome', { ascending: true });
    if (dadosProdutos) setProdutos(dadosProdutos);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await carregarDados();
    };
    init();
  }, [carregarDados]);

  async function carregarItensDaMesa(idMesa: number) {
    const { data } = await supabase
      .from('pedidos_mesa')
      .select('*')
      .eq('id_mesa', idMesa)
      .order('horario', { ascending: false });
    if (data) setItensDaMesa(data);
  }

  function handleClickMesa(mesa: Mesa) {
    if (mesa.status === 'ocupada') {
        setMesaSelecionada(mesa);
        setNumPessoas(1);
        carregarItensDaMesa(mesa.id);
    }
  }

  async function handleAbrirMesa(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const nomeCliente = prompt("Nome do Cliente:");
    if (!nomeCliente) return;
    await supabase.from('mesas').update({ status: 'ocupada', cliente: nomeCliente, total: 0 }).eq('id', id);
    await supabase.from('pedidos_mesa').delete().eq('id_mesa', id);
    carregarDados();
  }

  async function handleAdicionarPedido(produto: Produto) {
    if (!mesaSelecionada) return;
    if (produto.estoque_atual <= 0) {
        alert("⚠️ Estoque esgotado!");
        return;
    }

    await supabase.from('pedidos_mesa').insert([
      { id_mesa: mesaSelecionada.id, nome_produto: produto.nome, preco: produto.preco, observacao: obsAtual }
    ]);

    await supabase.rpc('decrement_estoque', { row_id: produto.id });

    const novoTotal = mesaSelecionada.total + produto.preco;
    await supabase.from('mesas').update({ total: novoTotal }).eq('id', mesaSelecionada.id);
    
    setObsAtual('');
    setMesaSelecionada({ ...mesaSelecionada, total: novoTotal });
    carregarItensDaMesa(mesaSelecionada.id); 
    carregarDados(); 
  }

  async function handleLiberarMesa() {
    if (!mesaSelecionada) return;
    if(!confirm(`Fechar conta da Mesa ${mesaSelecionada.id}?`)) return;
    
    const { data: itensFinais } = await supabase.from('pedidos_mesa').select('nome_produto, preco').eq('id_mesa', mesaSelecionada.id);
    await supabase.from('vendas').insert([{ cliente: mesaSelecionada.cliente, total: mesaSelecionada.total, itens: itensFinais }]);
    await supabase.from('pedidos_mesa').delete().eq('id_mesa', mesaSelecionada.id);
    await supabase.from('mesas').update({ status: 'livre', cliente: null, total: 0 }).eq('id', mesaSelecionada.id);
    
    setMesaSelecionada(null);
    carregarDados();
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-slate-100 border-t-4 border-amber-500">
      <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-700 transition group">
            <ArrowLeft className="text-amber-500 group-hover:-translate-x-1 transition" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-amber-50 tracking-tight uppercase">ARENA <span className="text-amber-500">BAR</span></h1>
            <p className="text-slate-400 text-sm">Gestão de Comandas</p>
          </div>
        </div>
        <button onClick={carregarDados} className="p-3 bg-amber-500 text-slate-900 rounded-full hover:rotate-180 transition-all duration-500 shadow-lg"><RotateCcw size={20} /></button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-amber-500 font-bold uppercase tracking-widest">Carregando Campo...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {mesas.map((mesa) => (
            <div 
              key={mesa.id}
              onClick={() => handleClickMesa(mesa)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                mesa.status === 'ocupada' ? 'bg-slate-800 border-amber-500 shadow-xl scale-105' : 'bg-slate-800/40 border-slate-700 hover:border-green-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xl font-black ${mesa.status === 'ocupada' ? 'text-amber-50' : 'text-slate-600'}`}>Mesa {mesa.id}</span>
                {mesa.status === 'ocupada' && <Clock size={18} className="text-amber-500 animate-pulse" />}
              </div>
              <div className="h-14">
                {mesa.status === 'ocupada' ? (
                  <>
                    <p className="text-xs text-slate-400 truncate uppercase font-bold">{mesa.cliente}</p>
                    <p className="text-xl font-black text-amber-500">R$ {mesa.total?.toFixed(2)}</p>
                  </>
                ) : (
                  <button onClick={(e) => handleAbrirMesa(mesa.id, e)} className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg text-xs font-black hover:bg-green-500 transition shadow-md uppercase">Abrir</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {mesaSelecionada && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex overflow-hidden">
            <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-black text-amber-50 text-sm uppercase flex items-center gap-2"><Receipt size={16} className="text-amber-500"/> Comanda</h3>
                <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded text-xs font-black uppercase">MESA {mesaSelecionada.id}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {itensDaMesa.map((item) => (
                  <div key={item.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-300 uppercase">{item.nome_produto}</span>
                      <span className="text-amber-500 font-bold">R$ {item.preco.toFixed(2)}</span>
                    </div>
                    {item.observacao && <p className="text-[10px] text-amber-500 italic mt-1 font-bold uppercase tracking-tighter">obs: {item.observacao}</p>}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={16} />
                    <span className="text-xs font-bold uppercase">Pessoas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setNumPessoas(Math.max(1, numPessoas - 1))} className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700">-</button>
                    <span className="font-black text-amber-50">{numPessoas}</span>
                    <button onClick={() => setNumPessoas(numPessoas + 1)} className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700">+</button>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Individual</span>
                    <span className="text-green-400 font-black text-xl">R$ {(mesaSelecionada.total / numPessoas).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total</span>
                    <span className="text-amber-50 font-black text-2xl tracking-tighter">R$ {mesaSelecionada.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="font-black text-amber-50 uppercase tracking-widest">Lançamento</h2>
                <button onClick={() => setMesaSelecionada(null)} className="p-2 hover:bg-slate-800 rounded-full transition"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-[0.2em]">Observações do Pedido</label>
                  <input 
                    type="text"
                    value={obsAtual}
                    onChange={(e) => setObsAtual(e.target.value)}
                    placeholder="Sem cebola, gelo e limão..."
                    className="w-full bg-slate-950 border border-slate-700 p-4 rounded-2xl text-amber-50 focus:border-amber-500 outline-none transition font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtos.map((prod) => (
                    <button key={prod.id} onClick={() => handleAdicionarPedido(prod)} className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl hover:bg-amber-500 hover:border-amber-400 hover:text-slate-900 transition-all group text-left">
                      <p className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-800 mb-1">{prod.categoria}</p>
                      <p className="font-bold text-slate-100 group-hover:text-slate-950 mb-2 truncate uppercase">{prod.nome}</p>
                      <p className="font-black text-green-400 group-hover:text-slate-900">R$ {prod.preco.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-slate-900/80 border-t border-slate-800">
                <button onClick={handleLiberarMesa} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-900/20 transition uppercase tracking-widest">Fechar Conta e Receber</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}