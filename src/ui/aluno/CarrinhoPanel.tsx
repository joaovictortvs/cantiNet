import { useState } from 'react';
import { brl } from '../../compartilhado/formatar';
import { paraHHMM } from '../../compartilhado/tempo';
import { useCarrinho } from '../contexto';
import { CartaoForm } from './CartaoForm';

const ROTULO_DO_BLOQUEIO = {
  CARRINHO_VAZIO: 'Adicione itens',
  SEM_CARTAO: 'Cadastre um cartão para pagar',
  SEM_HORARIO: 'Escolha um horário',
  PROCESSANDO: 'Processando…',
} as const;

export function CarrinhoPanel({ onPago }: { onPago: () => void }) {
  const { carrinho: c, carrinhoOps, pagamentoOps } = useCarrinho();
  const [editandoCartao, setEditandoCartao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function pagar() {
    setErro(null);
    const r = await pagamentoOps.pagar();
    if (r.ok) onPago();
    else setErro(r.erro || 'Não foi possível pagar.');
  }

  return (
    <aside className="carrinho">
      <h3>🛒 Seu pedido</h3>

      {c.itens.length === 0 ? (
        <p className="vazio">Adicione itens do cardápio. Pode misturar pronta-entrega, forno e chapa.</p>
      ) : (
        <ul className="carrinho-itens">
          {c.itens.map((i) => (
            <li key={i.produtoId}>
              <span className="ci-nome">
                {i.emoji} {i.nome}
              </span>
              <span className="stepper stepper-mini">
                <button aria-label="Diminuir" onClick={() => carrinhoOps.alterarQuantidade(i.produtoId, -1)}>
                  −
                </button>
                <span>{i.quantidade}</span>
                <button aria-label="Aumentar" onClick={() => carrinhoOps.alterarQuantidade(i.produtoId, 1)}>
                  +
                </button>
              </span>
              <span className="ci-preco">{brl(i.subtotal)}</span>
            </li>
          ))}
        </ul>
      )}

      {c.exigeHorario && (
        <div className="bloco">
          <h4>⏰ Horário de retirada</h4>
          <p className="nota">Seu pedido tem item feito na hora. Escolha o horário e a cozinha deixa tudo pronto junto.</p>
          <div className="slots">
            {c.horarios.map((s) => (
              <button
                key={s.minuto}
                className={`slot ${c.horarioEscolhido === s.minuto ? 'ativo' : ''}`}
                disabled={!s.disponivel}
                onClick={() => carrinhoOps.escolherHorario(s.minuto)}
                title={s.disponivel ? `${s.vagas} vaga(s)` : 'Sem vagas para este pedido'}
              >
                {paraHHMM(s.minuto)}
                <small>{s.disponivel ? `${s.vagas} vaga(s)` : 'lotado'}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {c.retiradaPrevista !== null && (
        <div className="bloco bloco-info">
          Retirada prevista: <strong>{paraHHMM(c.retiradaPrevista)}</strong>
        </div>
      )}

      <div className="bloco">
        <h4>💳 Pagamento</h4>
        {c.cartao && !editandoCartao ? (
          <div className="cartao-salvo">
            <span>
              {c.cartao.descricao}
              <small> · {c.cartao.tipo === 'CREDITO' ? 'Crédito' : 'Débito'}</small>
            </span>
            <button className="link" onClick={() => setEditandoCartao(true)}>
              trocar
            </button>
          </div>
        ) : (
          <CartaoForm onSalvo={() => setEditandoCartao(false)} />
        )}
      </div>

      <div className="total">
        <span>Total</span>
        <strong>{brl(c.total)}</strong>
      </div>

      {erro && <p className="erro">{erro}</p>}
      <button className="btn btn-pagar" disabled={c.bloqueio !== null} onClick={pagar}>
        {c.bloqueio ? ROTULO_DO_BLOQUEIO[c.bloqueio] : `Pagar ${brl(c.total)} em 1 clique`}
      </button>
    </aside>
  );
}
