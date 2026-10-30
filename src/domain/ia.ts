import { paraHHMM } from './tempo';
import type { Estacao, ItemPedido, Pedido, PlanoProducao, TarefaProducao } from './types';

const BANCADAS: Record<Exclude<Estacao, 'BALCAO'>, string[]> = {
  FORNO: ['Forno · bandeja 1', 'Forno · bandeja 2'],
  CHAPA: ['Chapa 1', 'Chapa 2'],
};

interface TarefaBruta {
  pedido: Pedido;
  estacao: Estacao;
  duracao: number;
  descricao: string;
}

function descrever(itens: ItemPedido[]): string {
  return itens.map((i) => `${i.quantidade}× ${i.nome}`).join(', ');
}

/**
 * "IA" orquestradora (mockada): agendamento reverso.
 * Para cada pedido, o alvo e o horario de retirada. Cada estacao comeca
 * (alvo - tempo de preparo), assim forno, chapa e balcao terminam juntos.
 * Se as bancadas estiverem ocupadas, a tarefa termina mais cedo e o item
 * fica aquecido ate o alvo.
 */
export function orquestrarCozinha(pedidos: Pedido[], agoraMin: number): PlanoProducao {
  const ativos = pedidos.filter((p) => p.status === 'AGUARDANDO' || p.status === 'EM_PREPARO');

  const brutas: TarefaBruta[] = [];
  for (const pedido of ativos) {
    (['FORNO', 'CHAPA'] as const).forEach((estacao) => {
      const itens = pedido.itens.filter((i) => i.categoria === estacao);
      if (itens.length === 0) return;
      brutas.push({
        pedido,
        estacao,
        duracao: Math.max(...itens.map((i) => i.tempoPreparoMin)),
        descricao: descrever(itens),
      });
    });
    const prontos = pedido.itens.filter((i) => i.categoria === 'PRONTA_ENTREGA');
    if (prontos.length > 0) {
      brutas.push({ pedido, estacao: 'BALCAO', duracao: 1, descricao: `Separar ${descrever(prontos)}` });
    }
  }

  const tarefas: TarefaProducao[] = [];
  const alertas: string[] = [];

  // Agendamento reverso por estacao: do alvo mais tardio para o mais cedo.
  const porEstacao: Estacao[] = ['FORNO', 'CHAPA', 'BALCAO'];
  for (const estacao of porEstacao) {
    const doGrupo = brutas
      .filter((b) => b.estacao === estacao)
      .sort((a, b) => b.pedido.retiradaMin - a.pedido.retiradaMin);

    const bancadas = estacao === 'BALCAO' ? ['Balcão'] : BANCADAS[estacao];
    const proximoInicio = bancadas.map(() => Infinity);

    for (const b of doGrupo) {
      const alvo = b.pedido.retiradaMin;
      let idx = 0;
      if (estacao !== 'BALCAO') {
        idx = proximoInicio.indexOf(Math.max(...proximoInicio));
      }
      const fim = estacao === 'BALCAO' ? alvo : Math.min(alvo, proximoInicio[idx]);
      const inicio = fim - b.duracao;
      if (estacao !== 'BALCAO') proximoInicio[idx] = inicio;

      const emAndamento = b.pedido.status === 'EM_PREPARO';
      const iniciarAgora = !emAndamento && inicio <= agoraMin;
      const atrasoMin = iniciarAgora ? Math.max(0, agoraMin - inicio) : 0;
      const aquecidoMin = Math.max(0, alvo - fim);

      tarefas.push({
        pedidoId: b.pedido.id,
        codigo: b.pedido.codigo,
        aluno: b.pedido.aluno,
        estacao,
        bancada: bancadas[idx],
        descricao: b.descricao,
        inicioMin: inicio,
        fimMin: fim,
        alvoMin: alvo,
        aquecidoMin,
        iniciarAgora,
        atrasoMin,
        emAndamento,
        ordem: 0,
      });

      if (atrasoMin > 0) {
        alertas.push(`${b.pedido.codigo}: começar ${b.estacao === 'CHAPA' ? 'a chapa' : 'o forno'} já — risco de ${atrasoMin} min de atraso.`);
      }
      if (aquecidoMin > 0 && estacao !== 'BALCAO') {
        alertas.push(`${b.pedido.codigo}: ${b.descricao} ficará pronto ${aquecidoMin} min antes; manter aquecido.`);
      }
    }
  }

  tarefas.sort((a, b) => a.inicioMin - b.inicioMin || a.alvoMin - b.alvoMin);
  tarefas.forEach((t, i) => (t.ordem = i + 1));

  const explicacoes = ativos.map((p) => {
    const dele = tarefas.filter((t) => t.pedidoId === p.id && t.estacao !== 'BALCAO');
    const partes = dele.map((t) => `${t.estacao === 'CHAPA' ? 'chapa' : 'forno'} às ${paraHHMM(t.inicioMin)}`);
    return partes.length > 0
      ? `${p.codigo}: tudo pronto às ${paraHHMM(p.retiradaMin)} → ${partes.join(' e ')}.`
      : `${p.codigo}: só pronta-entrega, separar às ${paraHHMM(p.retiradaMin - 1)}.`;
  });

  const proxima = tarefas.find((t) => !t.emAndamento);
  const resumo =
    ativos.length === 0
      ? 'Sem pedidos na fila. A IA está de olho.'
      : `${ativos.length} pedido(s) · ${tarefas.length} tarefa(s)` +
        (proxima ? ` · próxima: ${proxima.descricao} (${paraHHMM(proxima.inicioMin)})` : '');

  return { tarefas, alertas, explicacoes, resumo };
}
