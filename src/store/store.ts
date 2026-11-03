import { useEffect, useState, useSyncExternalStore } from 'react';
import { criarCardapioInicial } from '../data/cardapio';
import { calcularRetiradaSemChapa, gerarSlots, temItemDeChapa } from '../domain/agendamento';
import { baixarEstoque, buscarProduto, quantidadeNoCarrinho, reporEstoque, validarCarrinho } from '../domain/estoque';
import { cobrar, tokenizarCartao, validarCartao } from '../domain/pagamento';
import type { DadosCartao } from '../domain/pagamento';
import { criarPedido, montarItens, proximoStatus, totalDosItens } from '../domain/pedidos';
import { arredondarParaCima, minutosDoDia } from '../domain/tempo';
import type { Cartao, ItemCarrinho, Pedido, Produto } from '../domain/types';

/**
 * STORE EM MEMORIA (versao Go Horse).
 * Guarda estado + orquestra as regras do dominio. Na Entrega 2 isso vira
 * servicos/repositorios com interfaces (DIP) e responsabilidades separadas (SRP).
 */
export interface Estado {
  produtos: Produto[];
  carrinho: ItemCarrinho[];
  horarioChapaMin: number | null;
  cartao: Cartao | null;
  pedidos: Pedido[];
  offsetMin: number;
  processandoPagamento: boolean;
  aluno: string;
}

export const ALUNO_ATUAL = 'Você';

function estadoInicial(): Estado {
  return {
    produtos: criarCardapioInicial(),
    carrinho: [],
    horarioChapaMin: null,
    cartao: null,
    pedidos: [],
    offsetMin: 0,
    processandoPagamento: false,
    aluno: ALUNO_ATUAL,
  };
}

let estado: Estado = estadoInicial();
let contadorPedidos = 0;
const ouvintes = new Set<() => void>();

function atualizar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach((l) => l());
}

function inscrever(l: () => void) {
  ouvintes.add(l);
  return () => {
    ouvintes.delete(l);
  };
}

export function useEstado(): Estado {
  return useSyncExternalStore(inscrever, () => estado);
}

export function agoraEmMin(): number {
  return minutosDoDia(new Date()) + estado.offsetMin;
}

/** Hora atual (com o avanço da demo), atualizada a cada 10 s. */
export function useRelogio(): number {
  const e = useEstado();
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 10000);
    return () => clearInterval(t);
  }, []);
  return minutosDoDia(new Date()) + e.offsetMin;
}

function horarioContinuaValido(e: Estado): number | null {
  if (e.horarioChapaMin == null) return null;
  if (!temItemDeChapa(e.produtos, e.carrinho)) return null;
  const slot = gerarSlots(minutosDoDia(new Date()) + e.offsetMin, e.produtos, e.carrinho, e.pedidos).find(
    (s) => s.minuto === e.horarioChapaMin,
  );
  return slot && slot.disponivel ? e.horarioChapaMin : null;
}

function mudarCarrinho(carrinho: ItemCarrinho[]) {
  const proximo: Estado = { ...estado, carrinho };
  atualizar({ carrinho, horarioChapaMin: horarioContinuaValido(proximo) });
}

export const acoes = {
  adicionarAoCarrinho(produtoId: string) {
    const p = buscarProduto(estado.produtos, produtoId);
    if (!p) return;
    const qtd = quantidadeNoCarrinho(estado.carrinho, produtoId);
    if (qtd >= p.estoque) return;
    const existe = estado.carrinho.some((i) => i.produtoId === produtoId);
    mudarCarrinho(
      existe
        ? estado.carrinho.map((i) => (i.produtoId === produtoId ? { ...i, quantidade: i.quantidade + 1 } : i))
        : [...estado.carrinho, { produtoId, quantidade: 1 }],
    );
  },

  alterarQuantidade(produtoId: string, delta: number) {
    const p = buscarProduto(estado.produtos, produtoId);
    if (!p) return;
    const nova = Math.min(p.estoque, quantidadeNoCarrinho(estado.carrinho, produtoId) + delta);
    const semItem = estado.carrinho.filter((i) => i.produtoId !== produtoId);
    mudarCarrinho(nova <= 0 ? semItem : [...semItem, { produtoId, quantidade: nova }].sort(
      (a, b) => estado.carrinho.findIndex((x) => x.produtoId === a.produtoId) - estado.carrinho.findIndex((x) => x.produtoId === b.produtoId),
    ));
  },

  escolherHorario(minuto: number | null) {
    atualizar({ horarioChapaMin: minuto });
  },

  cadastrarCartao(dados: DadosCartao): { ok: boolean; erro?: string } {
    const erro = validarCartao(dados);
    if (erro) return { ok: false, erro };
    atualizar({ cartao: tokenizarCartao(dados) });
    return { ok: true };
  },

  removerCartao() {
    atualizar({ cartao: null });
  },

  async pagar(): Promise<{ ok: boolean; erro?: string }> {
    const e = estado;
    if (e.processandoPagamento) return { ok: false, erro: 'Pagamento em andamento.' };
    if (!e.cartao) return { ok: false, erro: 'Cadastre um cartão para pagar.' };
    const erros = validarCarrinho(e.produtos, e.carrinho);
    if (erros.length > 0) return { ok: false, erro: erros[0] };

    const agoraMin = agoraEmMin();
    let retirada: number;
    if (temItemDeChapa(e.produtos, e.carrinho)) {
      if (e.horarioChapaMin == null) return { ok: false, erro: 'Escolha o horário de retirada.' };
      const valido = horarioContinuaValido(e);
      if (valido == null) {
        atualizar({ horarioChapaMin: null });
        return { ok: false, erro: 'Esse horário acabou de lotar. Escolha outro.' };
      }
      retirada = valido;
    } else {
      retirada = calcularRetiradaSemChapa(agoraMin, e.produtos, e.carrinho);
    }

    const carrinhoPago = e.carrinho;
    const itens = montarItens(e.produtos, carrinhoPago);
    const cartao = e.cartao;
    atualizar({ processandoPagamento: true });
    const r = await cobrar(cartao, totalDosItens(itens));
    if (!r.ok) {
      atualizar({ processandoPagamento: false });
      return { ok: false, erro: r.erro ?? 'Pagamento recusado.' };
    }

    const atual = estado;
    if (validarCarrinho(atual.produtos, carrinhoPago).length > 0) {
      atualizar({ processandoPagamento: false });
      return { ok: false, erro: 'O estoque acabou durante o pagamento. Valor estornado.' };
    }

    const pedido = criarPedido({
      id: `P${++contadorPedidos}`,
      aluno: atual.aluno,
      itens,
      retiradaMin: retirada,
      criadoEmMin: agoraMin,
      pagoCom: `${cartao.bandeira} •••• ${cartao.ultimos4}`,
    });
    atualizar({
      produtos: baixarEstoque(atual.produtos, carrinhoPago),
      pedidos: [...atual.pedidos, pedido],
      carrinho: [],
      horarioChapaMin: null,
      processandoPagamento: false,
    });
    return { ok: true };
  },

  avancarStatus(pedidoId: string) {
    atualizar({
      pedidos: estado.pedidos.map((p) => (p.id === pedidoId ? { ...p, status: proximoStatus(p.status) } : p)),
    });
  },

  reporEstoque(produtoId: string, qtd: number) {
    atualizar({ produtos: reporEstoque(estado.produtos, produtoId, qtd) });
  },

  avancarRelogio(min: number) {
    atualizar({ offsetMin: estado.offsetMin + min });
  },

  /** Atalho para a gravação do vídeo: injeta 3 pedidos mistos já pagos. */
  gerarPedidosDemo() {
    const base = arredondarParaCima(agoraEmMin() + 12, 5);
    const demos: { aluno: string; carrinho: ItemCarrinho[]; retirada: number }[] = [
      {
        aluno: 'Ana',
        retirada: base,
        carrinho: [
          { produtoId: 'tapioca-queijo', quantidade: 2 },
          { produtoId: 'coxinha', quantidade: 1 },
          { produtoId: 'brigadeiro', quantidade: 1 },
        ],
      },
      {
        aluno: 'Bruno',
        retirada: base,
        carrinho: [
          { produtoId: 'cuscuz', quantidade: 1 },
          { produtoId: 'enroladinho', quantidade: 2 },
          { produtoId: 'suco', quantidade: 1 },
        ],
      },
      {
        aluno: 'Carla',
        retirada: base + 5,
        carrinho: [
          { produtoId: 'sanduiche', quantidade: 1 },
          { produtoId: 'coxinha', quantidade: 2 },
        ],
      },
    ];

    let produtos = estado.produtos;
    const novos: Pedido[] = [];
    for (const d of demos) {
      if (validarCarrinho(produtos, d.carrinho).length > 0) continue;
      novos.push(
        criarPedido({
          id: `P${++contadorPedidos}`,
          aluno: d.aluno,
          itens: montarItens(produtos, d.carrinho),
          retiradaMin: d.retirada,
          criadoEmMin: agoraEmMin(),
          pagoCom: 'Visa •••• 4242',
        }),
      );
      produtos = baixarEstoque(produtos, d.carrinho);
    }
    atualizar({ produtos, pedidos: [...estado.pedidos, ...novos] });
  },

  reiniciar() {
    contadorPedidos = 0;
    estado = estadoInicial();
    ouvintes.forEach((l) => l());
  },
};
