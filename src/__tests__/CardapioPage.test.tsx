
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import CardapioPage from '../app/cardapio/page';
import { cardapioService } from '../services/cardapioService';
import { Produto } from '../types';

// 1. Simulamos o Next.js
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// 2. Simulamos as chamadas ao banco de dados do cardápio
vi.mock('../services/cardapioService', () => ({
  cardapioService: {
    getProdutos: vi.fn(),
    adicionarProduto: vi.fn(),
    editarProduto: vi.fn(),
    atualizarEstoque: vi.fn(),
  },
}));

describe('Tela de Gestão do Cardápio', () => {
  const produtosMock = [
    { id: 101, nome: 'CERVEJA HEINEKEN', preco: 14, categoria: 'bebida', estoque_atual: 50 },
    { id: 102, nome: 'PORÇÃO DE BATATA', preco: 25, categoria: 'comida', estoque_atual: 10 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('deve exibir "Sincronizando..." e depois listar os produtos do banco', async () => {
    vi.mocked(cardapioService.getProdutos).mockResolvedValue(produtosMock as unknown as Produto[]);

    render(<CardapioPage />);

    // Verifica o estado de loading animado que você criou
    expect(screen.getByText('Sincronizando...')).toBeInTheDocument();

    // Aguarda os produtos aparecerem na tela
    await waitFor(() => {
      expect(screen.getByText('CERVEJA HEINEKEN')).toBeInTheDocument();
      expect(screen.getByText('PORÇÃO DE BATATA')).toBeInTheDocument();
      // O preço é formatado com .toFixed(2)
      expect(screen.getByText('R$ 14.00')).toBeInTheDocument(); 
    });
  });

  it('deve filtrar a lista de produtos ao usar a barra de busca', async () => {
    vi.mocked(cardapioService.getProdutos).mockResolvedValue(produtosMock as unknown as Produto[]);
    render(<CardapioPage />);

    await waitFor(() => expect(screen.getByText('CERVEJA HEINEKEN')).toBeInTheDocument());

    // Procura o input pelo placeholder que você definiu
    const inputBusca = screen.getByPlaceholderText('BUSCAR ITEM...');
    
    // Digita "BATATA" na busca
    fireEvent.change(inputBusca, { target: { value: 'BATATA' } });

    // A batata deve continuar na tela
    expect(screen.getByText('PORÇÃO DE BATATA')).toBeInTheDocument();
    
    // A cerveja deve sumir (usamos queryByText que retorna null se não encontrar)
    expect(screen.queryByText('CERVEJA HEINEKEN')).not.toBeInTheDocument();
  });

  it('deve abrir o modal de Novo Item e enviar os dados para o serviço', async () => {
    vi.mocked(cardapioService.getProdutos).mockResolvedValue([]);
    vi.mocked(cardapioService.adicionarProduto).mockResolvedValue();

    render(<CardapioPage />);
    await waitFor(() => expect(screen.queryByText('Sincronizando...')).not.toBeInTheDocument());

    // Clica no botão "Novo Item" (usando Regex /Novo Item/i para ignorar letras maiúsculas/minúsculas)
    const btnNovo = screen.getByText(/Novo Item/i);
    fireEvent.click(btnNovo);

    // Verifica se o modal abriu buscando o título dele
    expect(screen.getByText('NOVO')).toBeInTheDocument();

    // Preenche o nome do produto através do placeholder
    const inputNome = screen.getByPlaceholderText('EX: BRAHMA DUPLO MALTE');
    fireEvent.change(inputNome, { target: { value: 'ÁGUA COM GÁS' } });

    // Como os inputs de número não tem placeholder, pegamos eles pelo tipo (spinbutton)
    // O primeiro [0] é o preço, o segundo [1] é o estoque
    const inputsNumericos = screen.getAllByRole('spinbutton');
    fireEvent.change(inputsNumericos[0], { target: { value: '5' } }); // Preço
    fireEvent.change(inputsNumericos[1], { target: { value: '100' } }); // Estoque

    // Envia o formulário
    const btnCadastrar = screen.getByText(/Cadastrar Produto/i);
    fireEvent.click(btnCadastrar);

    // Verifica se a função do serviço foi chamada corretamente!
    await waitFor(() => {
      expect(cardapioService.adicionarProduto).toHaveBeenCalledWith(
        'ÁGUA COM GÁS', // Nome
        5,              // Preço
        'bebida',       // Categoria padrão
        100             // Estoque
      );
    });
  });
});