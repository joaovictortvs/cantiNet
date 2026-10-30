import { QRCodeSVG } from 'qrcode.react';
import { paraHHMM } from '../../domain/tempo';
import type { Pedido } from '../../domain/types';
import { ALUNO_ATUAL, useEstado } from '../../store/store';
import { ROTULO_STATUS } from '../categorias';
import { brl } from '../formatar';

function Ticket({ pedido }: { pedido: Pedido }) {
  const pronto = pedido.status === 'PRONTO';
  const entregue = pedido.status === 'ENTREGUE';
  return (
    <article className={`ticket status-${pedido.status.toLowerCase()} ${entregue ? 'ticket-entregue' : ''}`}>
      <div className={`ticket-faixa ${pronto ? 'faixa-pronto' : ''}`}>
        {pronto ? '✅ PRONTO PARA RETIRADA' : `${ROTULO_STATUS[pedido.status]}`}
      </div>
      <div className="ticket-corpo">
        <div className="ticket-qr">
          <QRCodeSVG value={`CANTINET|${pedido.codigo}|${pedido.id}`} size={132} level="M" />
          <div className="ticket-codigo">{pedido.codigo}</div>
        </div>
        <div className="ticket-detalhes">
          <p className="ticket-hora">
            Retirar às <strong>{paraHHMM(pedido.retiradaMin)}</strong>
          </p>
          <ul>
            {pedido.itens.map((i) => (
              <li key={i.produtoId}>
                {i.quantidade}× {i.emoji} {i.nome}
              </li>
            ))}
          </ul>
          <p className="nota">
            {brl(pedido.total)} · pago com {pedido.pagoCom}
          </p>
          {pronto && <p className="ticket-aviso">Mostre esta tela no balcão. A atendente entrega na hora.</p>}
        </div>
      </div>
    </article>
  );
}

export function MeusPedidos() {
  const e = useEstado();
  const meus = e.pedidos.filter((p) => p.aluno === ALUNO_ATUAL).slice().reverse();

  if (meus.length === 0) {
    return (
      <div className="vazio vazio-grande">
        <p>Você ainda não fez nenhum pedido.</p>
        <p className="nota">Depois de pagar, seu QR Code e o status aparecem aqui.</p>
      </div>
    );
  }
  return (
    <div className="tickets">
      {meus.map((p) => (
        <Ticket key={p.id} pedido={p} />
      ))}
    </div>
  );
}
