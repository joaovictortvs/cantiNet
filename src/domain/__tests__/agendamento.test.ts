import { describe, it, expect } from 'vitest';
import {
  CAPACIDADE_CHAPA_POR_SLOT,
  PASSO_SLOT_MIN,
  QTD_SLOTS,
  calcularRetiradaSemChapa,
  gerarSlots,
  temItemDeChapa,
} from '../agendamento';
import type { ItemCarrinho, Pedido, Produto } from '../types';

const AGORA = 10 * 60; // 10:00

const prod = (id: string, categoria: Produto['categoria'], tempoPreparoMin: number): Produto => ({
  id,
  nome: id,
  categoria,
  preco: 5,
  emoji: '🍽️',
  estoque: 50,
  tempoPreparoMin,
});

const produtos: Produto[] = [
  prod('tapioca', 'CHAPA', 6),
  prod('cuscuz', 'CHAPA', 5),
  prod('coxinha', 'FORNO', 8),
  prod('forno-lento', 'FORNO', 14),
  prod('suco-laranja', 'SUCO_NATURAL', 3),
  prod('suco-lento', 'SUCO_NATURAL', 20),
  prod('agua', 'PRONTA_ENTREGA', 0),
];

const carrinho = (...itens: [string, number][]): ItemCarrinho[] =>
  itens.map(([produtoId, quantidade]) => ({ produtoId, quantidade }));

const pedidoExistente = (
  retiradaMin: number,
  categoria: Pedido['itens'][number]['categoria'],
  quantidade: number,
  status: Pedido['status'] = 'AGUARDANDO',
): Pedido => ({
  id: `P-${retiradaMin}-${categoria}`,
  codigo: 'CNT-TEST',
  aluno: 'Ana',
  itens: [
    { produtoId: 'x', nome: 'x', categoria, emoji: '🍽️', quantidade, precoUnit: 5, tempoPreparoMin: 5 },
  ],
  total: 10,
  retiradaMin,
  criadoEmMin: AGORA,
  status,
  pagoCom: 'Visa •••• 4242',
});

describe('agendamento de retirada: slots da chapa', () => {
  const comChapa = carrinho(['tapioca', 1]);

  it('gera QTD_SLOTS horários de PASSO_SLOT_MIN em PASSO_SLOT_MIN minutos', () => {
    const slots = gerarSlots(AGORA, produtos, comChapa, []);
    expect(slots).toHaveLength(QTD_SLOTS);
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].minuto - slots[i - 1].minuto).toBe(PASSO_SLOT_MIN);
    }
  });

  it('o primeiro horário nunca fica no passado e respeita o tempo de preparo', () => {
    const [primeiro] = gerarSlots(AGORA, produtos, comChapa, []);
    expect(primeiro.minuto > AGORA + 6).toBe(true); // tapioca leva 6 min
    expect(primeiro.minuto % PASSO_SLOT_MIN).toBe(0);
    expect(primeiro.minuto).toBe(AGORA + 10); // 10:07 arredondado para 10:10
  });

  it('usa o maior tempo entre chapa e forno no mesmo pedido', () => {
    const [soChapa] = gerarSlots(AGORA, produtos, comChapa, []);
    const [comForno] = gerarSlots(AGORA, produtos, carrinho(['tapioca', 1], ['forno-lento', 1]), []);
    expect(soChapa.minuto).toBe(AGORA + 10);
    expect(comForno.minuto).toBe(AGORA + 15); // forno 14 min + 1
  });

  it('o suco natural também atrasa o primeiro horário', () => {
    const [primeiro] = gerarSlots(AGORA, produtos, carrinho(['tapioca', 1], ['suco-lento', 1]), []);
    expect(primeiro.minuto).toBe(AGORA + 25); // 20 min + 1 = 10:21 -> 10:25
  });

  it('começa com todas as vagas livres', () => {
    const slots = gerarSlots(AGORA, produtos, comChapa, []);
    expect(slots.every((s) => s.vagas === CAPACIDADE_CHAPA_POR_SLOT && s.disponivel)).toBe(true);
  });

  it('respeita o limite de vagas da chapa por horário', () => {
    const horario = AGORA + 10;
    const pedidos = [pedidoExistente(horario, 'CHAPA', CAPACIDADE_CHAPA_POR_SLOT - 1)]; // sobra 1 vaga
    const um = gerarSlots(AGORA, produtos, carrinho(['tapioca', 1]), pedidos).find((s) => s.minuto === horario)!;
    const dois = gerarSlots(AGORA, produtos, carrinho(['tapioca', 2]), pedidos).find((s) => s.minuto === horario)!;
    expect(um.vagas).toBe(1);
    expect(um.disponivel).toBe(true);
    expect(dois.disponivel).toBe(false);
  });

  it('o horário lotado não afeta os outros horários', () => {
    const horario = AGORA + 10;
    const pedidos = [pedidoExistente(horario, 'CHAPA', CAPACIDADE_CHAPA_POR_SLOT)];
    const slots = gerarSlots(AGORA, produtos, comChapa, pedidos);
    expect(slots.find((s) => s.minuto === horario)!.disponivel).toBe(false);
    expect(slots.find((s) => s.minuto === horario + PASSO_SLOT_MIN)!.disponivel).toBe(true);
  });

  it('libera a vaga quando o pedido é entregue', () => {
    const horario = AGORA + 10;
    const pedidos = [pedidoExistente(horario, 'CHAPA', CAPACIDADE_CHAPA_POR_SLOT, 'ENTREGUE')];
    const slot = gerarSlots(AGORA, produtos, comChapa, pedidos).find((s) => s.minuto === horario)!;
    expect(slot.vagas).toBe(CAPACIDADE_CHAPA_POR_SLOT);
    expect(slot.disponivel).toBe(true);
  });

  it('pedidos de forno, suco ou pronta-entrega não consomem vaga da chapa', () => {
    const horario = AGORA + 10;
    const pedidos = [
      pedidoExistente(horario, 'FORNO', 10),
      pedidoExistente(horario, 'SUCO_NATURAL', 10),
      pedidoExistente(horario, 'PRONTA_ENTREGA', 10),
    ];
    const slot = gerarSlots(AGORA, produtos, comChapa, pedidos).find((s) => s.minuto === horario)!;
    expect(slot.vagas).toBe(CAPACIDADE_CHAPA_POR_SLOT);
  });

  it('sem item de chapa no carrinho nenhum horário fica disponível', () => {
    const slots = gerarSlots(AGORA, produtos, carrinho(['coxinha', 1]), []);
    expect(slots.some((s) => s.disponivel)).toBe(false);
  });
});

describe('agendamento: só precisa escolher horário quando há chapa', () => {
  it('temItemDeChapa', () => {
    expect(temItemDeChapa(produtos, carrinho(['tapioca', 1]))).toBe(true);
    expect(temItemDeChapa(produtos, carrinho(['tapioca', 1], ['coxinha', 1]))).toBe(true);
    expect(temItemDeChapa(produtos, carrinho(['coxinha', 1]))).toBe(false);
    expect(temItemDeChapa(produtos, carrinho(['suco-laranja', 1]))).toBe(false);
    expect(temItemDeChapa(produtos, carrinho(['agua', 2]))).toBe(false);
    expect(temItemDeChapa(produtos, [])).toBe(false);
  });
});

describe('agendamento: retirada sem chapa', () => {
  it('só pronta-entrega: quase imediata (1 min)', () => {
    expect(calcularRetiradaSemChapa(AGORA, produtos, carrinho(['agua', 2]))).toBe(AGORA + 1);
  });
  it('com forno: espera o forno', () => {
    expect(calcularRetiradaSemChapa(AGORA, produtos, carrinho(['coxinha', 2]))).toBe(AGORA + 8);
  });
  it('com suco natural: espera o liquidificador (bug: antes dava 1 min)', () => {
    expect(calcularRetiradaSemChapa(AGORA, produtos, carrinho(['suco-laranja', 1]))).toBe(AGORA + 3);
  });
  it('forno e suco juntos: vale o mais demorado', () => {
    expect(calcularRetiradaSemChapa(AGORA, produtos, carrinho(['coxinha', 1], ['suco-laranja', 1]))).toBe(AGORA + 8);
    expect(calcularRetiradaSemChapa(AGORA, produtos, carrinho(['suco-lento', 1], ['coxinha', 1]))).toBe(AGORA + 20);
  });
  it('carrinho vazio: 1 min', () => {
    expect(calcularRetiradaSemChapa(AGORA, produtos, [])).toBe(AGORA + 1);
  });
});