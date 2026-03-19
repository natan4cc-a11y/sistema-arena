"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Clock, RotateCcw, X, Receipt, ArrowLeft, Users, Utensils, CreditCard, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

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
  
  // 🌟 NOVO ESTADO: ITENS SELECIONADOS PARA PAGAMENTO PARCIAL
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const carregarDados = useCallback(async () => {
    try {
      const { data: dadosMesas } = await supabase.from('mesas').select('*').order('id', { ascending: true });
      if (dadosMesas) setMesas(dadosMesas);
      const { data: dadosProdutos } = await supabase.from('produtos').select('*').order('nome', { ascending: true });
      if (dadosProdutos) setProdutos(dadosProdutos);
    } catch (error) {
      console.error("Erro Arena:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let montado = true;
    if (montado) carregarDados();
    return () => { montado = false; };
  }, [carregarDados]);

  async function carregarItensDaMesa(idMesa: number) {
    const { data } = await supabase.from('pedidos_mesa').select('*').eq('id_mesa', idMesa).order('horario', { ascending: false });
    if (data) setItensDaMesa(data);
    setSelecionados([]); // Limpa seleção ao mudar de mesa
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
    const nomeCliente = prompt("NOME DO CLIENTE:");
    if (!nomeCliente) return;
    await supabase.from('mesas').update({ status: 'ocupada', cliente: nomeCliente, total: 0 }).eq('id', id);
    await supabase.from('pedidos_mesa').delete().eq('id_mesa', id);
    carregarDados();
  }

  async function handleAdicionarPedido(produto: Produto) {
    if (!mesaSelecionada) return;
    if (produto.estoque_atual <= 0) return alert("⚠️ ESTOQUE ESGOTADO!");

    await supabase.from('pedidos_mesa').insert([{ id_mesa: mesaSelecionada.id, nome_produto: produto.nome, preco: produto.preco, observacao: obsAtual }]);
    await supabase.rpc('decrement_estoque', { row_id: produto.id });

    const novoTotal = (mesaSelecionada.total || 0) + produto.preco;
    await supabase.from('mesas').update({ total: novoTotal }).eq('id', mesaSelecionada.id);
    
    setObsAtual('');
    setMesaSelecionada({ ...mesaSelecionada, total: novoTotal });
    carregarItensDaMesa(mesaSelecionada.id); 
    carregarDados(); 
  }

  // 🌟 FUNÇÃO PARA SELECIONAR/DESELECIONAR ITEM
  function toggleSelecao(id: number) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  // 🌟 FUNÇÃO PARA PAGAR MÚLTIPLOS ITENS SELECIONADOS
  async function handlePagamentoSelecionados() {
    if (!mesaSelecionada || selecionados.length === 0) return;

    const itensParaPagar = itensDaMesa.filter(item => selecionados.includes(item.id));
    const totalParcial = itensParaPagar.reduce((acc, item) => acc + item.preco, 0);

    if (!confirm(`PAGAR R$ ${totalParcial.toFixed(2)} REFERENTE A ${selecionados.length} ITENS?`)) return;

    try {
      // 1. Envia para vendas
      await supabase.from('vendas').insert([{ 
        cliente: `${mesaSelecionada.cliente} (Parcial)`, 
        total: totalParcial, 
        itens: itensParaPagar.map(i => ({ nome: i.nome_produto, preco: i.preco })) 
      }]);

      // 2. Remove da mesa
      await supabase.from('pedidos_mesa').delete().in('id', selecionados);

      // 3. Atualiza mesa
      const novoTotalMesa = Math.max(0, (mesaSelecionada.total || 0) - totalParcial);
      await supabase.from('mesas').update({ total: novoTotalMesa }).eq('id', mesaSelecionada.id);

      setMesaSelecionada({ ...mesaSelecionada, total: novoTotalMesa });
      carregarItensDaMesa(mesaSelecionada.id);
      carregarDados();
      alert("PAGAMENTO PARCIAL REALIZADO!");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLiberarMesa() {
    if (!mesaSelecionada) return;
    if(!confirm(`FECHAR CONTA TOTAL?`)) return;
    const { data: itensFinais } = await supabase.from('pedidos_mesa').select('nome_produto, preco').eq('id_mesa', mesaSelecionada.id);
    await supabase.from('vendas').insert([{ cliente: mesaSelecionada.cliente, total: mesaSelecionada.total, itens: itensFinais }]);
    await supabase.from('pedidos_mesa').delete().eq('id_mesa', mesaSelecionada.id);
    await supabase.from('mesas').update({ status: 'livre', cliente: null, total: 0 }).eq('id', mesaSelecionada.id);
    setMesaSelecionada(null);
    carregarDados();
  }

  return (
    <div className="min-h-screen bg-black text-[#EAE4D3] p-6 font-sans">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-[#1a1a1a] rounded-2xl text-[#f97316] hover:scale-110 transition border border-white/5"><ArrowLeft size={24} /></Link>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#EAE4D3] rounded-xl relative overflow-hidden"><Image src="/logo-arena.png" alt="Logo" fill className="object-contain p-1" /></div>
             <div><h1 className="text-2xl font-black uppercase italic leading-none">ARENA <span className="text-[#f97316]">BAR</span></h1><p className="text-[9px] tracking-[0.3em] opacity-30 uppercase font-bold mt-1 text-[#EAE4D3]">MAPA DE MESAS</p></div>
          </div>
        </div>
        <button onClick={carregarDados} className="p-3 bg-[#1a1a1a] text-[#f97316] rounded-2xl hover:rotate-180 transition-all duration-500"><RotateCcw size={20} /></button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (<div className="col-span-full text-center py-20 opacity-20 font-black">CARREGANDO...</div>) : (
          mesas.map((mesa) => (
            <div key={mesa.id} onClick={() => handleClickMesa(mesa)} className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center gap-3 ${mesa.status === 'ocupada' ? 'bg-[#1a1a1a] border-[#f97316]' : 'bg-[#0a0a0a] border-white/5'}`}>
              <span className={`text-xl font-black italic self-start ${mesa.status === 'ocupada' ? 'text-white' : 'text-white/20'}`}>#{mesa.id}</span>
              <Utensils size={32} className={mesa.status === 'ocupada' ? 'text-[#f97316]' : 'text-white/10'} />
              {mesa.status === 'ocupada' ? (
                  <div className="text-center"><p className="text-[10px] text-white/40 truncate uppercase font-bold">{mesa.cliente}</p><p className="text-xl font-black text-[#f97316]">R$ {mesa.total?.toFixed(2)}</p></div>
                ) : (
                  <button onClick={(e) => handleAbrirMesa(mesa.id, e)} className="px-6 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase">Abrir</button>
                )}
            </div>
          ))
        )}
      </main>

      {mesaSelecionada && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-2 md:p-6 backdrop-blur-xl">
          <div className="bg-[#111] border border-white/10 rounded-[3rem] w-full max-w-6xl h-full md:h-[90vh] flex flex-col md:flex-row overflow-hidden">
            
            <div className="w-full md:w-96 bg-black border-r border-white/5 flex flex-col">
              <div className="p-6 border-b border-white/5 bg-[#1a1a1a] flex justify-between items-center">
                <h3 className="font-black text-white text-lg uppercase italic text-[#f97316]">COMANDA MESA {mesaSelecionada.id}</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {itensDaMesa.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => toggleSelecao(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        selecionados.includes(item.id) ? 'bg-[#f97316]/10 border-[#f97316]' : 'bg-[#1a1a1a] border-white/5'
                      }`}
                    >
                        <div className="max-w-[70%] text-left">
                           <span className="font-black text-white text-[10px] uppercase block truncate">{item.nome_produto}</span>
                           <p className="text-[8px] opacity-30 font-bold uppercase">{selecionados.includes(item.id) ? 'SELECIONADO' : 'LANÇADO'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-white font-black text-sm">R$ {item.preco.toFixed(2)}</span>
                           {selecionados.includes(item.id) && <Check size={14} className="text-[#f97316]" />}
                        </div>
                    </div>
                ))}
              </div>

              <div className="p-8 bg-[#1a1a1a] border-t border-white/5 space-y-4">
                {selecionados.length > 0 && (
                  <button onClick={handlePagamentoSelecionados} className="w-full bg-[#f97316] text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40">
                    <CreditCard size={16} /> PAGAR SELECIONADOS (R$ {itensDaMesa.filter(i => selecionados.includes(i.id)).reduce((a,b) => a + b.preco, 0).toFixed(2)})
                  </button>
                )}
                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                  <span className="text-[9px] text-white/30 font-black uppercase italic tracking-widest">Total Restante</span>
                  <span className="text-[#EAE4D3] font-black text-4xl italic tracking-tighter leading-none">R$ {mesaSelecionada.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-white/5 bg-[#1a1a1a]/50 flex justify-between items-center text-white italic font-black uppercase">
                <h2>Adicionar Itens</h2>
                <button onClick={() => setMesaSelecionada(null)} className="p-3 bg-black rounded-2xl hover:text-red-500 transition"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {produtos.map((prod) => (
                    <button key={prod.id} onClick={() => handleAdicionarPedido(prod)} className="p-6 bg-[#1a1a1a] border border-white/5 rounded-[2rem] hover:border-[#f97316] transition-all text-left group">
                      <p className="font-black text-white text-xs uppercase italic mb-2 group-hover:text-[#f97316]">{prod.nome}</p>
                      <p className="font-black text-green-500 text-lg italic">R$ {prod.preco.toFixed(2)}</p>
                    </button>
                  ))}
              </div>
              <div className="p-8 bg-black/60 border-t border-white/5">
                <button onClick={handleLiberarMesa} className="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.4em] transition shadow-2xl">
                    Fechar Conta Total
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="mt-16 opacity-10 text-[9px] font-black tracking-[1em] text-center">ARENA BAR</footer>
    </div>
  );
}