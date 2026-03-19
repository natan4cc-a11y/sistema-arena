export interface Mesa {
  id: number;
  status: 'livre' | 'ocupada' | 'conta';
  cliente: string | null;
  total: number;
}

export interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: 'bebida' | 'comida';
  estoque_atual: number;
}

export interface ItemPedido {
  id: number;
  nome_produto: string;
  preco: number;
  horario: string;
  observacao?: string;
}

export interface PedidoCozinha {
  id: number;
  id_mesa: number;
  nome_produto: string;
  horario: string;
  status: string;
  observacao?: string;
}

export interface Funcionario {
  id: number;
  nome_completo: string;
  cargo: string;
  senha?: string;
}

export interface Venda {
  id: number;
  data_venda: string;
  cliente: string;
  total: number;
  itens: Record<string, unknown>[];
}