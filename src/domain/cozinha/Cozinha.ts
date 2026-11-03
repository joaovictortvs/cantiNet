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

export interface BlocoTimeline {
  pedidoId: string;
  codigo: string;
  estacaoId: string;
  estacaoNome: string;
  /** Índice da bancada dentro da estação (0, 1, ...). */
  bancada: number;
  produto: string;
  inicioMin: number;
  fimMin: number;
  /** Minutos que o item fica aquecido esperando a retirada. */
  aquecidoMin: number;
  /** Já passou da hora de começar: iniciar agora. */
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
  produto: ProdutoPreparavel;
  duracao: number;
}

/**
 * A "IA" (determinística): agendamento reverso.
 * Cada item termina no horário de retirada; se a bancada já está ocupada pelo
 * pedido seguinte, o item termina antes e fica aquecido até o alvo.
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
      tarefas.sort(
        (a, b) =>
          b.pedido.alvoMin - a.pedido.alvoMin ||
          a.pedido.codigo.localeCompare(b.pedido.codigo) ||
          a.produto.nome.localeCompare(b.produto.nome),
      );

      // limite[b] = instante em que a bancada b precisa estar livre (início da tarefa já alocada depois).
      const limite: number[] = new Array(Math.min(estacao.bancadas, tarefas.length)).fill(
        Number.POSITIVE_INFINITY,
      );

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
          produto: t.produto.nome,
          inicioMin: inicio,
          fimMin: fim,
          aquecidoMin,
          atrasado,
        });

        if (atrasado) {
          alertas.push(
            `${t.pedido.codigo}: iniciar agora ${t.produto.nome} (${estacao.nome}); deveria ter começado há ${agoraMin - inicio} min.`,
          );
        }
        if (aquecidoMin > 0) {
          alertas.push(
            `${t.pedido.codigo}: ${t.produto.nome} termina cedo e fica aquecido por ${aquecidoMin} min.`,
          );
        }
      }
    }

    // Itens de categorias sem nenhuma estação cadastrada.
    const conhecidas = new Set(this.estacoes.map((e) => e.categoria));
    for (const p of pedidos)
      for (const i of p.itens)
        if (!conhecidas.has(i.produto.categoria))
          alertas.push(
            `${p.codigo}: nenhuma estação atende a categoria ${i.produto.categoria} (${i.produto.nome}).`,
          );

    blocos.sort(
      (a, b) =>
        a.inicioMin - b.inicioMin ||
        a.estacaoId.localeCompare(b.estacaoId) ||
        a.bancada - b.bancada ||
        a.codigo.localeCompare(b.codigo),
    );

    return {
      blocos,
      alertas,
      inicioMin: blocos.length ? Math.min(...blocos.map((b) => b.inicioMin)) : agoraMin,
      fimMin: blocos.length ? Math.max(...blocos.map((b) => b.fimMin + b.aquecidoMin)) : agoraMin,
    };
  }

  private tarefasDa(estacao: Estacao, pedidos: readonly PedidoParaCozinha[]): Tarefa[] {
    const out: Tarefa[] = [];
    for (const pedido of pedidos)
      for (const item of pedido.itens) {
        if (item.produto.categoria !== estacao.categoria) continue;
        const duracao = estacao.tempoPreparo(item.produto);
        if (duracao <= 0) continue;
        for (let n = 0; n < item.quantidade; n++) out.push({ pedido, produto: item.produto, duracao });
      }
    return out;
  }
}
