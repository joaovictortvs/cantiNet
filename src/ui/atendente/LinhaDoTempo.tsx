import { useMemo } from "react";
import type { Cozinha, PedidoParaCozinha } from "../../domain/cozinha/Cozinha";

interface Props {
  cozinha: Cozinha;
  pedidos: PedidoParaCozinha[];
  /** Minutos desde 00:00 (use o relógio simulado do app). */
  agoraMin: number;
}

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(Math.round(min % 60)).padStart(2, "0")}`;

/**
 * Linha do tempo da cozinha. É recalculada a cada mudança nos pedidos (ou no relógio),
 * então o gráfico se reorganiza sozinho. Uma estação nova aparece sem alterar este arquivo.
 */
export function LinhaDoTempo({ cozinha, pedidos, agoraMin }: Props) {
  const plano = useMemo(() => cozinha.planejar(pedidos, agoraMin), [cozinha, pedidos, agoraMin]);

  if (plano.blocos.length === 0) return <p>Nenhum preparo na fila.</p>;

  const ini = Math.min(plano.inicioMin, agoraMin);
  const fim = Math.max(plano.fimMin, agoraMin + 1);
  const pct = (m: number) => ((m - ini) / (fim - ini)) * 100;

  // Uma linha por (estação, bancada)
  const linhas = Array.from(
    new Map(plano.blocos.map((b) => [`${b.estacaoId}#${b.bancada}`, `${b.estacaoNome} ${b.bancada + 1}`])),
  );

  return (
    <section aria-label="Linha do tempo da cozinha">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span>{hhmm(ini)}</span>
        <span>agora {hhmm(agoraMin)}</span>
        <span>{hhmm(fim)}</span>
      </div>

      {linhas.map(([chave, rotulo]) => (
        <div key={chave} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
          <strong style={{ width: 130, fontSize: 13 }}>{rotulo}</strong>
          <div style={{ position: "relative", flex: 1, height: 36, background: "rgba(127,127,127,.12)", borderRadius: 6 }}>
            {plano.blocos
              .filter((b) => `${b.estacaoId}#${b.bancada}` === chave)
              .map((b, i) => (
                <div
                  key={`${b.pedidoId}-${i}`}
                  title={`${b.codigo} · ${b.produto} · ${hhmm(b.inicioMin)}–${hhmm(b.fimMin)}`}
                  style={{
                    position: "absolute",
                    left: `${pct(b.inicioMin)}%`,
                    width: `${Math.max(pct(b.fimMin) - pct(b.inicioMin), 4)}%`,
                    top: 2,
                    bottom: 2,
                    padding: "0 6px",
                    borderRadius: 6,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    border: b.atrasado ? "2px solid #b00020" : "1px solid rgba(0,0,0,.35)",
                    background: "rgba(40,120,200,.25)",
                  }}
                >
                  {b.codigo} {b.produto}
                  {b.aquecidoMin > 0 ? ` · aquecido ${b.aquecidoMin} min` : ""}
                  {b.atrasado ? " · INICIAR AGORA" : ""}
                </div>
              ))}
          </div>
        </div>
      ))}

      {plano.alertas.length > 0 && (
        <ul aria-label="Alertas da cozinha">
          {plano.alertas.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
