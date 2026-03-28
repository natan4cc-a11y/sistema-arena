import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import RelatoriosPage from '../app/relatorios/page';
import { relatoriosService } from '../services/relatoriosService';
import { Venda } from '../types';

// 1. Mock do Next Link
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// 2. Mock do Service de Relatórios
vi.mock('../services/relatoriosService', () => ({
  relatoriosService: {
    getVendasPorPeriodo: vi.fn(),
  },
}));

describe('Financeiro Arena - Relatórios', () => {
  const vendasMock: Venda[] = [
    { 
      id: 1, 
      cliente: 'NATAN', 
      total: 100.00, 
      data_venda: '2026-03-27T19:00:00Z',
      itens: [] 
    },
    { 
      id: 2, 
      cliente: 'ARENA CLIENTE', 
      total: 50.00, 
      data_venda: '2026-03-27T20:00:00Z',
      itens: [] 
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve calcular e exibir o faturamento total e ticket médio corretamente', async () => {
    vi.mocked(relatoriosService.getVendasPorPeriodo).mockResolvedValue(vendasMock);

    render(<RelatoriosPage />);

    await waitFor(() => {
      // Usamos Regex para ignorar espaços e formatação de moeda
      expect(screen.getByText(/150,00/i)).toBeInTheDocument();
      expect(screen.getByText(/75,00/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('deve trocar o período e buscar novos dados ao clicar nos botões do header', async () => {
    vi.mocked(relatoriosService.getVendasPorPeriodo).mockResolvedValue(vendasMock);
    
    render(<RelatoriosPage />);

    const btnMes = screen.getByText(/mes/i);
    fireEvent.click(btnMes);

    await waitFor(() => {
      expect(relatoriosService.getVendasPorPeriodo).toHaveBeenCalledWith('mes');
    });
  });

  it('deve exibir mensagem de erro caso a conexão com o banco falhe', async () => {
    vi.mocked(relatoriosService.getVendasPorPeriodo).mockRejectedValue(new Error("Erro de conexão"));

    render(<RelatoriosPage />);

    await waitFor(() => {
      expect(screen.getByText(/Erro: Erro de conexão/i)).toBeInTheDocument();
    });
  });

 it('deve exibir "Nenhuma venda neste período" quando a lista retornar vazia', async () => {
    vi.mocked(relatoriosService.getVendasPorPeriodo).mockResolvedValue([]);

    render(<RelatoriosPage />);

    await waitFor(() => {
      // 1. Verifica se a mensagem de "vazio" na tabela aparece
      expect(screen.getByText(/Nenhuma venda neste período/i)).toBeInTheDocument();
      
      // 2. CORREÇÃO: Usamos getAllByText porque o "0,00" aparece nos cards 
      // de Faturamento E de Ticket Médio. O length deve ser 2.
      const elementosZero = screen.getAllByText(/0,00/i);
      expect(elementosZero.length).toBe(2);
      
      // 3. Verifica o card de quantidade de vendas (que exibe apenas "0")
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });
});