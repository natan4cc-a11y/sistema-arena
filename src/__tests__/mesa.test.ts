import { describe, it, expect } from 'vitest'

// Função simples para testar a lógica do Arena Bar
function calcularTotalRestante(totalMesa: number, valorPago: number) {
  return totalMesa - valorPago;
}

describe('Financeiro Arena Bar', () => {
  it('deve subtrair o pagamento parcial do total da mesa corretamente', () => {
    const totalOriginal = 100;
    const pagamentoParcial = 30;
    
    const resultado = calcularTotalRestante(totalOriginal, pagamentoParcial);
    
    expect(resultado).toBe(70);
  });

  it('não deve deixar o saldo da mesa errado se o valor for zero', () => {
    expect(calcularTotalRestante(50, 0)).toBe(50);
  });
});