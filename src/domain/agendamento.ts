import { arredondarParaCima } from './tempo';
import type { Categoria, ItemCarrinho, Pedido, Produto } from './types';

export const PASSO_SLOT_MIN = 5;
/** Quantas unidades de chapa a cozinha consegue entregar por horario (2 chapas). */
export const CAPACIDADE_CHAPA_POR_SLOT = 4;
export const QTD_SLOTS = 9;

export interface Slot {
  minuto: number;
  vagas: number;
  disponivel: boolean;
}

function itensDaCategoria(produtos: Produto[], carrinho: ItemCarrinho[], categoria: Categoria) {
  return carrinho.filter((i) => produtos.find((p) => p.id === i.produtoId)?.categoria === categoria);
}

export function quantidadeDaCategoria(
  produtos: Produto[],
  carrinho: ItemCarrinho[],
  categoria: Categoria,
): number {
  return itensDaCategoria(produtos, carrinho, categoria).reduce((s, i) => s + i.quantidade, 0);
}

export function temItemDeChapa(produtos: Produto[], carrinho: ItemCarrinho[]): boolean {
  return quantidadeDaCategoria(produtos, carrinho, 'CHAPA') > 0;
}

export function tempoMaximo(produtos: Produto[], carrinho: ItemCarrinho[], categoria: Categoria): number {
  return itensDaCategoria(produtos, carrinho, categoria).reduce((max, i) => {
    const p = produtos.find((x) => x.id === i.produtoId);
    return Math.max(max, p?.tempoPreparoMin ?? 0);
  }, 0);
}

function vagasUsadas(pedidos: Pedido[], minuto: number): number {
  return pedidos
    .filter((p) => p.status !== 'ENTREGUE' && p.retiradaMin === minuto)
    .reduce(
      (soma, p) =>
        soma + p.itens.filter((i) => i.categoria === 'CHAPA').reduce((s, i) => s + i.quantidade, 0),
      0,
    );
}

/** Horarios de retirada estilo "barbearia" para pedidos com item de chapa. */
export function gerarSlots(
  agoraMin: number,
  produtos: Produto[],
  carrinho: ItemCarrinho[],
  pedidos: Pedido[],
): Slot[] {
  const qtd = quantidadeDaCategoria(produtos, carrinho, 'CHAPA');
  const preparo = Math.max(
    tempoMaximo(produtos, carrinho, 'CHAPA'),
    tempoMaximo(produtos, carrinho, 'FORNO'),
  );
  const primeiro = arredondarParaCima(agoraMin + preparo + 1, PASSO_SLOT_MIN);
  const slots: Slot[] = [];
  for (let i = 0; i < QTD_SLOTS; i++) {
    const minuto = primeiro + i * PASSO_SLOT_MIN;
    const vagas = Math.max(0, CAPACIDADE_CHAPA_POR_SLOT - vagasUsadas(pedidos, minuto));
    slots.push({ minuto, vagas, disponivel: qtd > 0 && vagas >= qtd });
  }
  return slots;
}

/** Sem item de chapa: retirada assim que o forno terminar (ou quase imediata). */
export function calcularRetiradaSemChapa(
  agoraMin: number,
  produtos: Produto[],
  carrinho: ItemCarrinho[],
): number {
  return agoraMin + Math.max(tempoMaximo(produtos, carrinho, 'FORNO'), 1);
}
