import { Cozinha, type PedidoParaCozinha } from './cozinha/Cozinha';
import { criarEstacoesPadrao, ID_BALCAO } from './cozinha/estacoes';
import { paraHHMM } from './tempo';
import type { Pedido, PlanoProducao, TarefaProducao } from './types';

/**
 * Cozinha única do app. Para criar uma estação nova (ex.: Liquidificador),
 * implemente a interface Estacao e registre em criarEstacoesPadrao().
 * Este arquivo não precisa mudar.
 */
export const cozinha = new Cozinha(criarEstacoesPadrao());

export function paraCozinha(p: Pedido): PedidoParaCozinha {
  return {
    id: p.id,
    codigo: p.codigo,
    alvoMin: p.retiradaMin,
    itens: p.itens.map((i) => ({
      produto: { id: i.produtoId, nome: i.nome, categoria: i.categoria, tempoPreparoMin: i.tempoPreparoMin },
      quantidade: i.quantidade,
    })),
  };
}

/**
 * "IA" orquestradora (mockada): agendamento reverso, agora sobre estações plugáveis.
 * Para cada pedido, o alvo é o horário de retirada. Cada estação começa
 * (alvo - tempo de preparo), assim todas terminam juntas. Se as bancadas
 * estiverem ocupadas, a tarefa termina mais cedo e o item fica aquecido até o alvo.
 */
export function orquestrarCozinha(pedidos: Pedido[], agoraMin: number): PlanoProducao {
  const ativos = pedidos.filter((p) => p.status === 'AGUARDANDO' || p.status === 'EM_PREPARO');
  const porId = new Map(ativos.map((p) => [p.id, p]));
  const plano = cozinha.planejar(ativos.map(paraCozinha), agoraMin);

  const alertas: string[] = [];
  const nomeDaEstacao = new Map<string, string>(); // chave da tarefa -> nome da estação

  const tarefas: TarefaProducao[] = plano.blocos.map((b) => {
    const pedido = porId.get(b.pedidoId)!;
    const emAndamento = pedido.status === 'EM_PREPARO';
    const iniciarAgora = !emAndamento && b.inicioMin <= agoraMin;
    const atrasoMin = iniciarAgora ? Math.max(0, agoraMin - b.inicioMin) : 0;

    nomeDaEstacao.set(`${b.pedidoId}-${b.estacaoId}`, b.estacaoNome);

    if (atrasoMin > 0) {
      alertas.push(`${b.codigo}: começar ${b.estacaoNome.toLowerCase()} já — risco de ${atrasoMin} min de atraso.`);
    }
    if (b.aquecidoMin > 0 && b.estacaoId !== ID_BALCAO) {
      alertas.push(`${b.codigo}: ${b.descricao} ficará pronto ${b.aquecidoMin} min antes; manter aquecido.`);
    }

    return {
      pedidoId: b.pedidoId,
      codigo: b.codigo,
      aluno: pedido.aluno,
      estacao: b.estacaoId,
      bancada: b.rotuloBancada,
      descricao: b.descricao,
      inicioMin: b.inicioMin,
      fimMin: b.fimMin,
      alvoMin: b.alvoMin,
      aquecidoMin: b.aquecidoMin,
      iniciarAgora,
      atrasoMin,
      emAndamento,
      ordem: 0,
    };
  });

  tarefas.sort((a, b) => a.inicioMin - b.inicioMin || a.alvoMin - b.alvoMin);
  tarefas.forEach((t, i) => (t.ordem = i + 1));

  const explicacoes = ativos.map((p) => {
    const dele = tarefas.filter((t) => t.pedidoId === p.id && t.estacao !== ID_BALCAO);
    const partes = dele.map(
      (t) => `${(nomeDaEstacao.get(`${t.pedidoId}-${t.estacao}`) ?? t.estacao).toLowerCase()} às ${paraHHMM(t.inicioMin)}`,
    );
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