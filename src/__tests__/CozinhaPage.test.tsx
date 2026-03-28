import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import CozinhaPage from '../app/cozinha/page';
import { cozinhaService } from '../services/cozinhaService';

// 1. Simulamos o Next.js e o Service
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('../services/cozinhaService', () => ({
  cozinhaService: {
    buscarPedidosPendentes: vi.fn(),
    marcarComoPronto: vi.fn(),
    inscreverAtualizacoes: vi.fn(() => ({ unsubscribe: vi.fn() })),
    removerInscricao: vi.fn(),
  },
}));

describe('Tela da Cozinha - Arena Bar', () => {
  const pedidosMock = [
    { 
      id: 1, 
      id_mesa: 5, 
      nome_produto: 'PICANHA NA CHAPA', 
      horario: new Date().toISOString(), 
      observacao: 'BEM PASSADA',
      status: 'pendente'
    },
    { 
      id: 2, 
      id_mesa: 2, 
      nome_produto: 'CAIPIRINHA', 
      horario: new Date().toISOString(), 
      observacao: '',
      status: 'pendente'
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve listar os pedidos pendentes com mesa e observação', async () => {
    vi.mocked(cozinhaService.buscarPedidosPendentes).mockResolvedValue(pedidosMock);

    render(<CozinhaPage />);

    // Verifica se os itens principais carregaram
    await waitFor(() => {
      expect(screen.getByText('MESA 5')).toBeInTheDocument();
      expect(screen.getByText('PICANHA NA CHAPA')).toBeInTheDocument();
      expect(screen.getByText('Obs: BEM PASSADA')).toBeInTheDocument();
      expect(screen.getByText('MESA 2')).toBeInTheDocument();
    });
  });

  it('deve chamar o serviço para finalizar o pedido ao clicar no botão', async () => {
    vi.mocked(cozinhaService.buscarPedidosPendentes).mockResolvedValue(pedidosMock);
    vi.mocked(cozinhaService.marcarComoPronto).mockResolvedValue(undefined);

    render(<CozinhaPage />);

    await waitFor(() => expect(screen.getByText('PICANHA NA CHAPA')).toBeInTheDocument());

    // Clica no botão de finalizar do primeiro pedido (Picanha)
    const botoesFinalizar = screen.getAllByText(/Finalizar Pedido/i);
    fireEvent.click(botoesFinalizar[0]);

    // Verifica se o serviço foi chamado com o ID correto (ID 1 da Picanha)
    await waitFor(() => {
      expect(cozinhaService.marcarComoPronto).toHaveBeenCalledWith(1);
    });
  });

  it('deve exibir mensagem quando a cozinha estiver vazia', async () => {
    // Simula retorno de lista vazia
    vi.mocked(cozinhaService.buscarPedidosPendentes).mockResolvedValue([]);

    render(<CozinhaPage />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhum pedido pendente/i)).toBeInTheDocument();
    });
  });

  it('deve atualizar a lista ao clicar no botão de recarregar', async () => {
    vi.mocked(cozinhaService.buscarPedidosPendentes).mockResolvedValue([]);
    
    render(<CozinhaPage />);
    
    // O botão de recarregar é o que tem o ícone RotateCcw (o único botão no header além do voltar)
    const btnRecarregar = screen.getAllByRole('button')[0]; 
    fireEvent.click(btnRecarregar);

    expect(cozinhaService.buscarPedidosPendentes).toHaveBeenCalledTimes(2); // Uma no mount, outra no clique
  });
});