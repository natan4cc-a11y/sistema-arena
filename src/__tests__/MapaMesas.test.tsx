/* eslint-disable @next/next/no-img-element */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Ensina o TypeScript o que é 'toBeInTheDocument'
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import MapaMesas from '../app/mesas/page';
import { mesasService } from '../services/mesasService';
import { Mesa, Produto, ItemPedido } from '../types';

// 1. Simulamos os componentes do Next.js sem usar 'any'
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img alt="mock" {...props} />,
}));

// 2. Simulamos o nosso serviço
vi.mock('../services/mesasService', () => ({
  mesasService: {
    getMesas: vi.fn(),
    getProdutos: vi.fn(),
    getItensDaMesa: vi.fn(),
    abrirMesa: vi.fn(),
    adicionarPedido: vi.fn(),
    pagamentoParcial: vi.fn(),
    fecharMesa: vi.fn(),
  },
}));

describe('Tela de Mapa de Mesas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('deve exibir "CARREGANDO..." inicialmente e depois mostrar as mesas', async () => {
    const mesasMock = [
      { id: 1, status: 'livre', total: 0 },
      { id: 2, status: 'ocupada', cliente: 'João Silva', total: 50 },
    ];
    // Usamos 'as unknown as Mesa[]' para o TypeScript aprovar os dados incompletos do mock
    vi.mocked(mesasService.getMesas).mockResolvedValue(mesasMock as unknown as Mesa[]);
    vi.mocked(mesasService.getProdutos).mockResolvedValue([]);

    render(<MapaMesas />);

    expect(screen.getByText('CARREGANDO...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });

  it('deve abrir uma mesa ao clicar no botão Abrir e inserir um nome', async () => {
    const mesasMock = [{ id: 1, status: 'livre', total: 0 }];
    vi.mocked(mesasService.getMesas).mockResolvedValue(mesasMock as unknown as Mesa[]);
    vi.mocked(mesasService.getProdutos).mockResolvedValue([]);

    vi.spyOn(window, 'prompt').mockReturnValue('Maria');

    render(<MapaMesas />);
    await waitFor(() => expect(screen.getByText('#1')).toBeInTheDocument());

    const btnAbrir = screen.getByText('Abrir');
    fireEvent.click(btnAbrir);

    expect(window.prompt).toHaveBeenCalledWith('NOME DO CLIENTE:');
    expect(mesasService.abrirMesa).toHaveBeenCalledWith(1, 'Maria');
  });

  it('deve abrir a comanda de uma mesa ocupada e adicionar um produto', async () => {
    const mesasMock = [{ id: 5, status: 'ocupada', cliente: 'Carlos', total: 100 }];
    const produtosMock = [{ id: 99, nome: 'Cerveja', preco: 15, estoque_atual: 50 }];
    const itensMock = [{ id: 10, nome_produto: 'Amendoim', preco: 10 }];

    vi.mocked(mesasService.getMesas).mockResolvedValue(mesasMock as unknown as Mesa[]);
    vi.mocked(mesasService.getProdutos).mockResolvedValue(produtosMock as unknown as Produto[]);
    vi.mocked(mesasService.getItensDaMesa).mockResolvedValue(itensMock as unknown as ItemPedido[]);
    vi.mocked(mesasService.adicionarPedido).mockResolvedValue(115); 

    render(<MapaMesas />);
    await waitFor(() => expect(screen.getByText('#5')).toBeInTheDocument());

    fireEvent.click(screen.getByText('#5'));

    await waitFor(() => {
      expect(screen.getByText('COMANDA MESA 5')).toBeInTheDocument();
      expect(screen.getByText('Amendoim')).toBeInTheDocument(); 
      expect(screen.getByText('Cerveja')).toBeInTheDocument(); 
    });

    fireEvent.click(screen.getByText('Cerveja'));

    expect(mesasService.adicionarPedido).toHaveBeenCalledWith(
      5, 
      expect.objectContaining({ nome: 'Cerveja' }), 
      '', 
      100
    );
  });
});