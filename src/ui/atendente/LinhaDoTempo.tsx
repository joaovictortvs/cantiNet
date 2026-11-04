import type { TarefaVisao } from '../../app/visoes';
import { paraHHMM } from '../../compartilhado/tempo';

interface Props {
  /** Tarefas do plano da IA (orquestrarCozinha). O gráfico se reorganiza sozinho quando o plano muda. */
  tarefas: readonly TarefaVisao[];
  /** Minutos desde 00:00 (relógio da demo). */
  agoraMin: number;
}

/**
 * Linha do tempo da cozinha: uma linha por bancada (Forno · bandeja 1, Chapa 2, Liquidificador...).
 * Estação nova aparece aqui sem alterar este arquivo.
 */
export function LinhaDoTempo({ tarefas, agoraMin }: Props) {
  if (tarefas.length === 0) return <p className="vazio" style={{ gridColumn: '1 / -1' }}>Nenhum preparo na fila.</p>;

  const ini = Math.min(agoraMin, ...tarefas.map((t) => t.inicioMin));
  const fim = Math.max(agoraMin + 1, ...tarefas.map((t) => t.alvoMin));
  const pct = (m: number) => ((m - ini) / (fim - ini)) * 100;

  const bancadas = Array.from(new Set(tarefas.map((t) => t.bancada))).sort((a, b) => a.localeCompare(b));

  return (
    <section aria-label="Linha do tempo da cozinha" style={{ gridColumn: '1 / -1', width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '0 0 4px 138px' }}>
        <span>{paraHHMM(ini)}</span>
        <span>agora {paraHHMM(agoraMin)}</span>
        <span>{paraHHMM(fim)}</span>
      </div>

      {bancadas.map((bancada) => (
        <div key={bancada} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0' }}>
          <strong style={{ width: 130, fontSize: 13 }}>{bancada}</strong>
          <div style={{ position: 'relative', flex: 1, height: 38, background: 'rgba(127,127,127,.12)', borderRadius: 6 }}>
            {/* marcador do "agora" */}
            <div
              aria-hidden="true"
              style={{ position: 'absolute', left: `${pct(agoraMin)}%`, top: 0, bottom: 0, width: 2, background: '#b00020', zIndex: 1 }}
            />
            {tarefas
              .filter((t) => t.bancada === bancada)
              .map((t) => (
                <div key={`${t.pedidoId}-${t.estacao}`}>
                  {t.aquecidoMin > 0 && (
                    <div
                      title={`Aquecido até ${paraHHMM(t.alvoMin)}`}
                      style={{
                        position: 'absolute',
                        left: `${pct(t.fimMin)}%`,
                        width: `${pct(t.alvoMin) - pct(t.fimMin)}%`,
                        top: 6,
                        bottom: 6,
                        border: '1px dashed rgba(0,0,0,.45)',
                        borderRadius: 6,
                      }}
                    />
                  )}
                  <div
                    title={`${t.codigo} · ${t.descricao} · ${paraHHMM(t.inicioMin)}–${paraHHMM(t.fimMin)}`}
                    style={{
                      position: 'absolute',
                      left: `${pct(t.inicioMin)}%`,
                      width: `${Math.max(pct(t.fimMin) - pct(t.inicioMin), 6)}%`,
                      top: 3,
                      bottom: 3,
                      padding: '0 6px',
                      borderRadius: 6,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      border: t.iniciarAgora ? '2px solid #b00020' : '1px solid rgba(0,0,0,.35)',
                      background: t.emAndamento ? 'rgba(40,160,90,.3)' : 'rgba(40,120,200,.25)',
                    }}
                  >
                    {t.codigo} · {t.descricao}
                    {t.emAndamento ? ' · em andamento' : ''}
                    {t.iniciarAgora ? ' · INICIAR AGORA' : ''}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
      <p className="nota" style={{ gridColumn: '1 / -1' }}>Tracejado = item pronto esperando a retirada (mantido aquecido). Linha vermelha = agora.</p>
    </section>
  );
}