import { useMemo, useState } from 'react';
import { orquestrarCozinha } from '../../domain/ia';
import { ConfirmacaoPorQrCode, type RepositorioRetirada, type ResultadoRetirada } from '../../domain/retirada';
import { paraHHMM } from '../../domain/tempo';
import type { Pedido, StatusPedido, TarefaProducao } from '../../domain/types';
import { acoes, useEstado, useRelogio } from '../../store/store';
import { META_CATEGORIA, ORDEM_CATEGORIAS, ROTULO_STATUS } from '../categorias';
import { brl } from '../formatar';
import { LeitorQrCamera } from './LeitorQrCamera';
import { LinhaDoTempo } from './LinhaDoTempo';

const COLUNAS: { status: StatusPedido; titulo: string; botao: string | null }[] = [
  { status: 'AGUARDANDO', titulo: 'Na fila', botao: 'Iniciar preparo' },
  { status: 'EM_PREPARO', titulo: 'Em preparo', botao: 'Marcar pronto' },
  { status: 'PRONTO', titulo: 'Pronto', botao: 'Entregar ✔' },
];

function TarefaLinha({ t }: { t: TarefaProducao }) {
  return (
    <li className={`tarefa est-${t.estacao.toLowerCase()} ${t.emAndamento ? 'andamento' : ''}`}>
      <span className="tarefa-ordem">{t.ordem}</span>
      <div className="tarefa-corpo">
        <div className="tarefa-desc">
          <strong>{t.descricao}</strong>
          <span className="chip">{t.bancada}</span>
        </div>
        <div className="tarefa-meta">
          {t.codigo} · {t.aluno} · começa {paraHHMM(t.inicioMin)} → pronto {paraHHMM(t.fimMin)}
          {t.aquecidoMin > 0 && ` (aquecido até ${paraHHMM(t.alvoMin)})`}
        </div>
      </div>
      {t.emAndamento ? (
        <span className="tag tag-andamento">em andamento</span>
      ) : t.iniciarAgora ? (
        <span className="tag tag-agora">iniciar agora</span>
      ) : null}
    </li>
  );
}

function PedidoCard({ pedido, botao }: { pedido: Pedido; botao: string | null }) {
  return (
    <article className="pedido-card">
      <div className="pedido-topo">
        <strong>{pedido.codigo}</strong>
        <span className="chip">retirar {paraHHMM(pedido.retiradaMin)}</span>
      </div>
      <div className="nota">{pedido.aluno}</div>
      <ul>
        {pedido.itens.map((i) => (
          <li key={i.produtoId}>
            {i.quantidade}× {i.nome} <small className={`pt ${META_CATEGORIA[i.categoria].classe}`}>●</small>
          </li>
        ))}
      </ul>
      {botao && (
        <button className="btn btn-primario" onClick={() => acoes.avancarStatus(pedido.id)}>
          {botao}
        </button>
      )}
    </article>
  );
}

export function PainelAtendente() {
  const e = useEstado();
  const agora = useRelogio();
  const [busca, setBusca] = useState('');
  const [camera, setCamera] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRetirada | null>(null);

  const plano = useMemo(() => orquestrarCozinha(e.pedidos, agora), [e.pedidos, agora]);
  const entregues = e.pedidos.filter((p) => p.status === 'ENTREGUE').length;
  const termo = busca.trim().toUpperCase();

  /** Retirada pela câmera: ConfirmacaoPorQrCode implementa a mesma interface da confirmação por código. */
  function aoLerQrCode(texto: string) {
    const repo: RepositorioRetirada = {
      buscarPorCodigo: (codigo) => e.pedidos.find((p) => p.codigo === codigo),
      marcarEntregue: (id) => acoes.entregarPedido(id),
    };
    const r = new ConfirmacaoPorQrCode(repo).confirmar(texto);
    setResultado(r);
    if (r.ok) setCamera(false);
  }

  return (
    <section className="painel">
      <div className="painel-barra">
        <div>
          <h2>Painel da cozinha</h2>
          <p className="nota">
            {entregues} entregue(s) · {e.pedidos.length - entregues} em andamento
          </p>
        </div>
        <div className="painel-acoes">
          <input
            className="busca"
            placeholder="Conferir código (CNT-…)"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
          />
          <button
            className="btn"
            onClick={() => {
              setResultado(null);
              setCamera((c) => !c);
            }}
            title="Ler o QR Code do pedido pela câmera"
          >
            📷 Ler QR Code
          </button>
          <button className="btn" onClick={() => acoes.avancarRelogio(5)} title="Avançar o relógio da demo">
            ⏩ +5 min
          </button>
          <button className="btn btn-primario" onClick={() => acoes.gerarPedidosDemo()}>
            ➕ Pedidos de demonstração
          </button>
          <button className="btn btn-fantasma" onClick={() => acoes.reiniciar()}>
            ↺ Reiniciar
          </button>
        </div>
      </div>

      {(camera || resultado) && (
        <div className="estoque-card">
          <h3>📷 Retirada por QR Code</h3>
          {camera && <LeitorQrCamera onLeitura={aoLerQrCode} />}
          {resultado && (
            <p role="status">
              {resultado.ok ? `✔ Pedido ${resultado.codigo} entregue.` : `⚠️ ${resultado.mensagem}`}
            </p>
          )}
          <button
            className="btn btn-fantasma"
            onClick={() => {
              setCamera(false);
              setResultado(null);
            }}
          >
            Fechar
          </button>
        </div>
      )}

      <div className="ia-card">
        <div className="ia-topo">
          <span className="ia-selo">🤖 IA · Orquestrador de cozinha</span>
          <span className="ia-resumo">{plano.resumo}</span>
        </div>
        {plano.tarefas.length === 0 ? (
          <p className="vazio">Quando chegar um pedido, a IA monta aqui a ordem ideal de produção.</p>
        ) : (
          <div className="ia-grade">
            <ol className="tarefas">
              {plano.tarefas.map((t) => (
                <TarefaLinha key={`${t.pedidoId}-${t.estacao}`} t={t} />
              ))}
            </ol>
            <div className="ia-lado">
              <h4>Por que essa ordem?</h4>
              <ul className="explicacoes">
                {plano.explicacoes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              {plano.alertas.length > 0 && (
                <>
                  <h4>Alertas</h4>
                  <ul className="alertas">
                    {plano.alertas.map((a) => (
                      <li key={a}>⚠️ {a}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="estoque-card">
        <h3>🗓️ Linha do tempo da cozinha</h3>
        <LinhaDoTempo tarefas={plano.tarefas} agoraMin={agora} />
      </div>

      <div className="kanban">
        {COLUNAS.map((c) => {
          const pedidos = e.pedidos
            .filter((p) => p.status === c.status)
            .filter((p) => !termo || p.codigo.includes(termo))
            .sort((a, b) => a.retiradaMin - b.retiradaMin);
          return (
            <div key={c.status} className={`coluna coluna-${c.status.toLowerCase()}`}>
              <h3>
                {c.titulo} <span className="selo">{pedidos.length}</span>
              </h3>
              {pedidos.length === 0 && <p className="vazio">—</p>}
              {pedidos.map((p) => (
                <PedidoCard key={p.id} pedido={p} botao={c.botao} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="estoque-card">
        <h3>📦 Estoque (atualiza a cada venda)</h3>
        {ORDEM_CATEGORIAS.map((cat) => (
          <div key={cat} className={`estoque-grupo ${META_CATEGORIA[cat].classe}`}>
            <h4>
              {META_CATEGORIA[cat].icone} {META_CATEGORIA[cat].titulo}
            </h4>
            <ul>
              {e.produtos
                .filter((p) => p.categoria === cat)
                .map((p) => (
                  <li key={p.id}>
                    <span>
                      {p.emoji} {p.nome} <small className="nota">{brl(p.preco)}</small>
                    </span>
                    <span className={`qtd ${p.estoque === 0 ? 'zero' : p.estoque <= 3 ? 'baixo' : ''}`}>{p.estoque}</span>
                    <span className="repor">
                      <button onClick={() => acoes.reporEstoque(p.id, 1)}>+1</button>
                      <button onClick={() => acoes.reporEstoque(p.id, 5)}>+5</button>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="nota rodape-status">
        Fluxo: {ROTULO_STATUS.AGUARDANDO} → {ROTULO_STATUS.EM_PREPARO} → {ROTULO_STATUS.PRONTO} → {ROTULO_STATUS.ENTREGUE}
      </p>
    </section>
  );
}