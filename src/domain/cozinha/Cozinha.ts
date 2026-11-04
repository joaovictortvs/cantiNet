import type { Estacao, ProdutoPreparavel } from "./Estacao";

export interface ItemParaCozinha {
  produto: ProdutoPreparavel;
  quantidade: number;
}

export interface PedidoParaCozinha {
  id: string;
  codigo: string; // CNT-XXXX
  /** Horário de retirada, em minutos desde 00:00. */
  alvoMin: number;
  itens: ItemParaCozinha[];
}

/** Uma tarefa = um pedido em uma estação (todos os itens daquela estação juntos). */
export interface BlocoTimeline {
  pedidoId: string;
  codigo: string;
  estacaoId: string;
  estacaoNome: string;
  /** Índice da bancada dentro da estação (0, 1, ...). */
  bancada: number;
  rotuloBancada: string;
  descricao: string;
  inicioMin: number;
  fimMin: number;
  alvoMin: number;
  /** Minutos que o item fica pronto antes do alvo (precisa ficar aquecido). */
  aquecidoMin: number;
  /** Já passou da hora de começar. */
  atrasado: boolean;
}

export interface PlanoCozinha {
  blocos: BlocoTimeline[];
  alertas: string[];
  inicioMin: number;
  fimMin: number;
}

interface Tarefa {
  pedido: PedidoParaCozinha;
  descricao: string;
  duracao: number;
}

/**
 * A "IA" (determinística): agendamento reverso.
 * Cada tarefa termina no horário de retirada; se a bancada já está ocupada pela
 * tarefa seguinte, ela termina antes e fica aquecida até o alvo.
 * Conhece apenas a interface Estacao, nunca uma estação concreta.
 */
export class Cozinha {
  constructor(private readonly estacoes: readonly Estacao[]) {}

  planejar(pedidos: readonly PedidoParaCozinha[], agoraMin: number): PlanoCozinha {
    const blocos: BlocoTimeline[] = [];
    const alertas: string[] = [];

    for (const estacao of this.estacoes) {
      const tarefas = this.tarefasDa(estacao, pedidos);
      if (tarefas.length === 0) continue;

      // Do alvo mais tardio para o mais cedo; desempate estável.
      tarefas.sort((a, b) => b.pedido.alvoMin - a.pedido.alvoMin || a.pedido.codigo.localeCompare(b.pedido.codigo));

      // limite[b] = instante em que a bancada b precisa estar livre (início da tarefa já alocada depois dela).
      const limite: number[] = new Array(Math.min(estacao.bancadas, tarefas.length)).fill(Number.POSITIVE_INFINITY);

      for (const t of tarefas) {
        let b = 0;
        for (let i = 1; i < limite.length; i++) if (limite[i] > limite[b]) b = i;

        const fim = Math.min(t.pedido.alvoMin, limite[b]);
        const inicio = fim - t.duracao;
        limite[b] = inicio;

        const aquecidoMin = t.pedido.alvoMin - fim;
        const atrasado = inicio < agoraMin;

        blocos.push({
          pedidoId: t.pedido.id,
          codigo: t.pedido.codigo,
          estacaoId: estacao.id,
          estacaoNome: estacao.nome,
          bancada: b,
          rotuloBancada: this.rotulo(estacao, b),
          descricao: t.descricao,
          inicioMin: inicio,
          fimMin: fim,
          alvoMin: t.pedido.alvoMin,
          aquecidoMin,
          atrasado,
        });

        if (atrasado) {
          alertas.push(
            `${t.pedido.codigo}: iniciar agora ${t.descricao} (${estacao.nome}); deveria ter começado há ${agoraMin - inicio} min.`,
          );
        }
        if (aquecidoMin > 0) {
          alertas.push(`${t.pedido.codigo}: ${t.descricao} termina cedo e fica aquecido por ${aquecidoMin} min.`);
        }
      }
    }

    // Itens de categorias sem nenhuma estação cadastrada.
    const conhecidas = new Set(this.estacoes.map((e) => e.categoria));
    for (const p of pedidos)
      for (const i of p.itens)
        if (!conhecidas.has(i.produto.categoria))
          alertas.push(`${p.codigo}: nenhuma estação atende a categoria ${i.produto.categoria} (${i.produto.nome}).`);

    blocos.sort(
      (a, b) =>
        a.inicioMin - b.inicioMin ||
        a.alvoMin - b.alvoMin ||
        a.estacaoId.localeCompare(b.estacaoId) ||
        a.bancada - b.bancada ||
        a.codigo.localeCompare(b.codigo),
    );

    return {
      blocos,
      alertas,
      inicioMin: blocos.length ? Math.min(...blocos.map((b) => b.inicioMin)) : agoraMin,
      fimMin: blocos.length ? Math.max(...blocos.map((b) => b.alvoMin)) : agoraMin,
    };
  }

  private rotulo(estacao: Estacao, indice: number): string {
    if (estacao.rotuloBancada) return estacao.rotuloBancada(indice);
    return Number.isFinite(estacao.bancadas) && estacao.bancadas > 1 ? `${estacao.nome} ${indice + 1}` : estacao.nome;
  }

  private tarefasDa(estacao: Estacao, pedidos: readonly PedidoParaCozinha[]): Tarefa[] {
    const out: Tarefa[] = [];
    for (const pedido of pedidos) {
      const itens = pedido.itens.filter((i) => i.produto.categoria === estacao.categoria);
      if (itens.length === 0) continue;
      const duracao = Math.max(...itens.map((i) => estacao.tempoPreparo(i.produto)));
      if (duracao <= 0) continue;
      const lista = itens.map((i) => `${i.quantidade}× ${i.produto.nome}`).join(", ");
      out.push({ pedido, duracao, descricao: estacao.descricaoTarefa ? estacao.descricaoTarefa(lista) : lista });
    }
    return out;
  }
}