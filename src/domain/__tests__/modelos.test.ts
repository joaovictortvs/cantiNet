import { describe, expect, it } from 'vitest';
import { Carrinho } from '../modelos/Carrinho';
import { Pedido } from '../modelos/Pedido';
import { Produto } from '../modelos/Produto';

const itens = [
  { produtoId: 'coxinha', nome: 'Coxinha', categoria: 'FORNO' as const, emoji: '🍗', quantidade: 2, precoUnit: 7, tempoPreparoMin: 8 },
  { produtoId: 'agua', nome: 'Água', categoria: 'PRONTA_ENTREGA' as const, emoji: '💧', quantidade: 1, precoUnit: 3, tempoPreparoMin: 0 },
];
const pedido = () => new Pedido({ id: 'P1', codigo: 'CNT-AB12', aluno: 'Ana', itens, retiradaMin: 610, criadoEmMin: 600, pagoCom: 'Visa •••• 4242' });
const produto = (estoque = 2) => new Produto({ id: 'a', nome: 'A', categoria: 'FORNO', preco: 1, emoji: '🍽️', estoque, tempoPreparoMin: 1 });

describe('Pedido (Ocultamento de Informação)', () => {
  it('segue AGUARDANDO → EM_PREPARO → PRONTO → ENTREGUE e depois não muda', () => {
    const p = pedido();
    const vistos = [p.status];
    for (let i = 0; i < 4; i++) {
      p.avancar();
      vistos.push(p.status);
    }
    expect(vistos).toEqual(['AGUARDANDO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'ENTREGUE']);
  });

  it('transição inválida lança erro e não muda o status', () => {
    const p = pedido();
    expect(() => p.entregar()).toThrow('não é possível ir de AGUARDANDO para ENTREGUE');
    expect(p.status).toBe('AGUARDANDO');
  });

  it('o status não pode ser alterado de fora (campo realmente privado)', () => {
    const p = pedido();
    expect(() => {
      (p as unknown as { status: string }).status = 'ENTREGUE';
    }).toThrow();
    expect(p.status).toBe('AGUARDANDO');
    expect(Object.keys(p)).not.toContain('status');
  });

  it('itens são imutáveis por fora; total e resumo vêm do próprio pedido', () => {
    const p = pedido();
    expect(p.total).toBe(17);
    expect(p.resumo()).toBe('2× Coxinha, 1× Água');
    expect(() => (p.itens as unknown as unknown[]).push({})).toThrow();
    itens[0] = { ...itens[0], quantidade: 99 }; // mexer no array original não afeta o pedido
    expect(p.total).toBe(17);
    itens[0] = { ...itens[0], quantidade: 2 };
  });

  it('não existe pedido sem itens', () => {
    expect(() => new Pedido({ id: 'x', codigo: 'x', aluno: 'a', itens: [], retiradaMin: 0, criadoEmMin: 0, pagoCom: '' })).toThrow();
  });
});

describe('Produto', () => {
  it('estoque nunca fica negativo', () => {
    const p = produto();
    p.baixar(2);
    expect(p.estoque).toBe(0);
    expect(() => p.baixar(1)).toThrow('Estoque insuficiente');
    p.repor(3);
    expect(p.estoque).toBe(3);
  });

  it('o estoque não pode ser alterado de fora', () => {
    const p = produto();
    expect(() => {
      (p as unknown as { estoque: number }).estoque = 99;
    }).toThrow();
    expect(p.estoque).toBe(2);
    expect(Object.keys(p)).not.toContain('estoque');
  });

  it('recusa quantidade inválida', () => {
    expect(() => produto().baixar(0)).toThrow();
    expect(() => produto().repor(1.5)).toThrow();
  });
});

describe('Carrinho', () => {
  it('quantidade zero remove; a leitura devolve cópia', () => {
    const c = new Carrinho();
    c.definirQuantidade('a', 2);
    c.definirQuantidade('b', 1);
    c.definirQuantidade('a', 0);
    expect(c.itens).toEqual([{ produtoId: 'b', quantidade: 1 }]);
    (c.itens as { produtoId: string; quantidade: number }[]).pop();
    expect(c.estaVazio()).toBe(false);
  });
});
