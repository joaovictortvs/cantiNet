import { useState } from 'react';
import type { PedidoVisao, ResultadoRetirada, StatusVisao, TarefaVisao } from '../../app/visoes';
import { brl } from '../../compartilhado/formatar';
import { paraHHMM } from '../../compartilhado/tempo';
import { useDemonstracao, usePainel } from '../contexto';
import { LeitorQrCamera } from './LeitorQrCamera';
import { LinhaDoTempo } from './LinhaDoTempo';

const ROTULO_STATUS = {
  AGUARDANDO: 'Na fila',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
} as const;

const COLUNAS: { status: StatusVisao; chave: 'naFila' | 'emPreparo' | 'prontos'; titulo: string; botao: string }[] = [
  { status: 'AGUARDANDO', chave: 'naFila', titulo: 'Na fila', botao: 'Iniciar preparo' },
  { status: 'EM_PREPARO', chave: 'emPreparo', titulo: 'Em preparo', botao: 'Marcar pronto' },
  { status: 'PRONTO', chave: 'prontos', titulo: 'Pronto', botao: 'Entregar ✔' },
];

function TarefaLinha({ t }: { t: TarefaVisao }) {
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

function PedidoCard({ pedido, botao, aoAvancar }: { pedido: PedidoVisao; botao: string; aoAvancar: () => void }) {
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
            {i.quantidade}× {i.nome} <small className={`pt ${i.classeDaCategoria}`}>●</small>
          </li>
        ))}
      </ul>
      <button className="btn btn-primario" onClick={aoAvancar}>
        {botao}
      </button>
    </article>
  );
}

export function PainelAtendente() {
  const { painel, agoraMin: agora, cozinha, estoque } = usePainel();
  const demo = useDemonstracao();
  const [busca, setBusca] = useState('');
  const [camera, setCamera] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRetirada | null>(null);

  const plano = painel.plano;
  const termo = busca.trim().toUpperCase();

  /** Retirada pela câmera: a forma 'qrcode' implementa a mesma interface da confirmação por código. */
  function aoLerQrCode(texto: string) {
    const r = cozinha.confirmarRetirada('qrcode', texto);
    setResultado(r);
    if (r.ok) setCamera(false);
  }

  return (
    <section className="painel">
      <div className="painel-barra">
        <div>
          <h2>Painel da cozinha</h2>
          <p className="nota">
            {painel.entregues} entregue(s) · {painel.emAndamento} em andamento
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
          <button className="btn" onClick={() => demo.adiantarRelogio(5)} title="Avançar o relógio da demo">
            ⏩ +5 min
          </button>
          <button className="btn btn-primario" onClick={() => demo.gerarPedidosDeDemonstracao()}>
            ➕ Pedidos de demonstração
          </button>
          <button className="btn btn-fantasma" onClick={() => demo.reiniciar()}>
            ↺ Reiniciar
          </button>
        </div>
      </div>

      {(camera || resultado) && (
        <div className="estoque-card">
          <h3>📷 Retirada por QR Code</h3>
          <div style={{ gridColumn: '1 / -1', display: 'grid', gap: 10, justifyItems: 'start' }}>
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
          const pedidos = painel[c.chave].filter((p) => !termo || p.codigo.includes(termo));
          return (
            <div key={c.status} className={`coluna coluna-${c.status.toLowerCase()}`}>
              <h3>
                {c.titulo} <span className="selo">{pedidos.length}</span>
              </h3>
              {pedidos.length === 0 && <p className="vazio">—</p>}
              {pedidos.map((p) => (
                <PedidoCard key={p.id} pedido={p} botao={c.botao} aoAvancar={() => cozinha.avancarPedido(p.id)} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="estoque-card">
        <h3>📦 Estoque (atualiza a cada venda)</h3>
        {painel.estoque.map((cat) => (
          <div key={cat.id} className={`estoque-grupo ${cat.classe}`}>
            <h4>
              {cat.icone} {cat.titulo}
            </h4>
            <ul>
              {cat.produtos.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.emoji} {p.nome} <small className="nota">{brl(p.preco)}</small>
                  </span>
                  <span className={`qtd ${p.estoque === 0 ? 'zero' : p.estoque <= 3 ? 'baixo' : ''}`}>{p.estoque}</span>
                  <span className="repor">
                    <button onClick={() => estoque.reporEstoque(p.id, 1)}>+1</button>
                    <button onClick={() => estoque.reporEstoque(p.id, 5)}>+5</button>
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