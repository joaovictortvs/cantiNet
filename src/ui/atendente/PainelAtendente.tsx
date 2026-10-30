import { useMemo, useState } from 'react';
import { orquestrarCozinha } from '../../domain/ia';
import { paraHHMM } from '../../domain/tempo';
import type { Pedido, PlanoProducao, StatusPedido, TarefaProducao } from '../../domain/types';
import { acoes, useEstado, useRelogio } from '../../store/store';
import { META_CATEGORIA, ORDEM_CATEGORIAS } from '../categorias';
import { brl } from '../formatar';

type Aba = 'cozinha' | 'estoque';

const COLUNAS: { status: StatusPedido; titulo: string; botao: string; classe: string }[] = [
  { status: 'AGUARDANDO', titulo: 'Na fila', botao: 'Iniciar preparo', classe: 'acao-aguardando' },
  { status: 'EM_PREPARO', titulo: 'Em preparo', botao: 'Marcar pronto', classe: 'acao-em_preparo' },
  { status: 'PRONTO', titulo: 'Pronto', botao: 'Entregar ✔', classe: 'acao-pronto' },
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
          {t.codigo} · {t.aluno} · {paraHHMM(t.inicioMin)} → {paraHHMM(t.fimMin)}
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

function CardIA({ plano }: { plano: PlanoProducao }) {
  return (
    <section className="ia-card" aria-label="Fila sugerida pela IA">
      <div className="ia-topo">
        <span className="ia-selo">🤖 IA · Orquestrador de cozinha</span>
        <span className="ia-resumo">{plano.resumo}</span>
      </div>
      {plano.tarefas.length === 0 ? (
        <p className="vazio">Quando chegar um pedido, a IA monta aqui a ordem ideal de produção.</p>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}

function PedidoCard({
  pedido,
  botao,
  classeBotao,
  destaque,
}: {
  pedido: Pedido;
  botao: string;
  classeBotao: string;
  destaque: boolean;
}) {
  return (
    <article className={`pedido-card ${destaque ? 'destaque' : ''}`}>
      <div className="pedido-topo">
        <strong>{pedido.codigo}</strong>
        <span className="pedido-hora">{paraHHMM(pedido.retiradaMin)}</span>
      </div>
      <div className="nota">{pedido.aluno} · retirada</div>
      <ul>
        {pedido.itens.map((i) => (
          <li key={i.produtoId}>
            <span className={`pt ${META_CATEGORIA[i.categoria].classe}`} aria-hidden="true" />
            <strong>{i.quantidade}×</strong> {i.nome}
          </li>
        ))}
      </ul>
      <button className={`btn-acao ${classeBotao}`} onClick={() => acoes.avancarStatus(pedido.id)}>
        {botao}
      </button>
    </article>
  );
}

function Kanban({ termo }: { termo: string }) {
  const e = useEstado();
  return (
    <div className="kanban">
      {COLUNAS.map((c) => {
        const pedidos = e.pedidos
          .filter((p) => p.status === c.status)
          .filter((p) => !termo || p.codigo.includes(termo))
          .sort((a, b) => a.retiradaMin - b.retiradaMin);
        return (
          <section key={c.status} className={`coluna coluna-${c.status.toLowerCase()}`} aria-label={c.titulo}>
            <h3>
              {c.titulo} <span className="selo">{pedidos.length}</span>
            </h3>
            {pedidos.length === 0 && <p className="vazio">Nenhum pedido aqui.</p>}
            {pedidos.map((p) => (
              <PedidoCard
                key={p.id}
                pedido={p}
                botao={c.botao}
                classeBotao={c.classe}
                destaque={termo !== '' && p.codigo === termo}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function EstoqueView() {
  const e = useEstado();
  return (
    <div className="estoque-card">
      <h3>📦 Estoque · atualiza sozinho a cada venda</h3>
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
                    <button aria-label={`Repor 1 de ${p.nome}`} onClick={() => acoes.reporEstoque(p.id, 1)}>
                      +1
                    </button>
                    <button aria-label={`Repor 5 de ${p.nome}`} onClick={() => acoes.reporEstoque(p.id, 5)}>
                      +5
                    </button>
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function PainelAtendente() {
  const e = useEstado();
  const agora = useRelogio();
  const [aba, setAba] = useState<Aba>('cozinha');
  const [busca, setBusca] = useState('');

  const plano = useMemo(() => orquestrarCozinha(e.pedidos, agora), [e.pedidos, agora]);
  const conta = (s: StatusPedido) => e.pedidos.filter((p) => p.status === s).length;
  const termo = busca.trim().toUpperCase();

  return (
    <section className="painel">
      <div className="painel-barra">
        <div className="pills" aria-label="Resumo dos pedidos">
          <div className="pill">
            <strong>{conta('AGUARDANDO')}</strong> na fila
          </div>
          <div className="pill pill-preparo">
            <strong>{conta('EM_PREPARO')}</strong> em preparo
          </div>
          <div className="pill pill-pronto">
            <strong>{conta('PRONTO')}</strong> prontos
          </div>
        </div>

        <div className="segmento segmento-grande" role="tablist" aria-label="Seção do painel">
          <button role="tab" aria-selected={aba === 'cozinha'} className={aba === 'cozinha' ? 'ativa' : ''} onClick={() => setAba('cozinha')}>
            🍳 Cozinha
          </button>
          <button role="tab" aria-selected={aba === 'estoque'} className={aba === 'estoque' ? 'ativa' : ''} onClick={() => setAba('estoque')}>
            📦 Estoque
          </button>
        </div>

        {aba === 'cozinha' && (
          <input
            className="busca"
            aria-label="Conferir código do pedido"
            placeholder="Código CNT-…"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
          />
        )}
      </div>

      {aba === 'cozinha' ? (
        <div className="cozinha">
          <Kanban termo={termo} />
          <CardIA plano={plano} />
        </div>
      ) : (
        <EstoqueView />
      )}

      <details className="demo">
        <summary>🎬 Ferramentas de demonstração</summary>
        <div className="demo-botoes">
          <button className="btn btn-primario" onClick={() => acoes.gerarPedidosDemo()}>
            ➕ Pedidos de demonstração
          </button>
          <button className="btn" onClick={() => acoes.avancarRelogio(5)}>
            ⏩ Avançar 5 min
          </button>
          <button className="btn btn-fantasma" onClick={() => acoes.reiniciar()}>
            ↺ Reiniciar
          </button>
        </div>
      </details>
    </section>
  );
}
