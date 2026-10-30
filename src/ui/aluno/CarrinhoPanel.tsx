import { useState } from 'react';
import { calcularRetiradaSemChapa, gerarSlots, temItemDeChapa } from '../../domain/agendamento';
import { montarItens, totalDosItens } from '../../domain/pedidos';
import { paraHHMM } from '../../domain/tempo';
import { acoes, useEstado, useRelogio } from '../../store/store';
import { brl } from '../formatar';
import { CartaoForm } from './CartaoForm';

export function CarrinhoPanel({ onPago }: { onPago: () => void }) {
  const e = useEstado();
  const agora = useRelogio();
  const [editandoCartao, setEditandoCartao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const itens = montarItens(e.produtos, e.carrinho);
  const total = totalDosItens(itens);
  const comChapa = temItemDeChapa(e.produtos, e.carrinho);
  const slots = comChapa ? gerarSlots(agora, e.produtos, e.carrinho, e.pedidos) : [];
  const retiradaAuto =
    itens.length > 0 && !comChapa ? calcularRetiradaSemChapa(agora, e.produtos, e.carrinho) : null;

  const precisaHorario = comChapa && e.horarioChapaMin == null;
  const podePagar = itens.length > 0 && !!e.cartao && !precisaHorario && !e.processandoPagamento;

  async function pagar() {
    setErro(null);
    const r = await acoes.pagar();
    if (r.ok) onPago();
    else setErro(r.erro ?? 'Não foi possível pagar.');
  }

  return (
    <aside className="carrinho" id="carrinho" aria-label="Seu pedido">
      <h3>🛒 Seu pedido</h3>

      {itens.length === 0 ? (
        <p className="vazio">Adicione itens do cardápio. Pode misturar pronta-entrega, forno e chapa.</p>
      ) : (
        <ul className="carrinho-itens">
          {itens.map((i) => (
            <li key={i.produtoId}>
              <span className="ci-nome">
                {i.emoji} {i.nome}
              </span>
              <span className="stepper stepper-mini">
                <button aria-label="Diminuir" onClick={() => acoes.alterarQuantidade(i.produtoId, -1)}>
                  −
                </button>
                <span>{i.quantidade}</span>
                <button aria-label="Aumentar" onClick={() => acoes.alterarQuantidade(i.produtoId, 1)}>
                  +
                </button>
              </span>
              <span className="ci-preco">{brl(i.precoUnit * i.quantidade)}</span>
            </li>
          ))}
        </ul>
      )}

      {comChapa && (
        <div className="bloco">
          <h4>⏰ Horário de retirada</h4>
          <p className="nota">Seu pedido tem item feito na hora. Escolha o horário e a cozinha deixa tudo pronto junto.</p>
          <div className="slots">
            {slots.map((s) => (
              <button
                key={s.minuto}
                className={`slot ${e.horarioChapaMin === s.minuto ? 'ativo' : ''}`}
                disabled={!s.disponivel}
                onClick={() => acoes.escolherHorario(s.minuto)}
                title={s.disponivel ? `${s.vagas} vaga(s)` : 'Sem vagas para este pedido'}
              >
                {paraHHMM(s.minuto)}
                <small>{s.disponivel ? `${s.vagas} vaga(s)` : 'lotado'}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {retiradaAuto != null && (
        <div className="bloco bloco-info">
          Retirada prevista: <strong>{paraHHMM(retiradaAuto)}</strong>
        </div>
      )}

      <div className="bloco">
        <h4>💳 Pagamento</h4>
        {e.cartao && !editandoCartao ? (
          <div className="cartao-salvo">
            <span>
              {e.cartao.bandeira} •••• {e.cartao.ultimos4}
              <small> · {e.cartao.tipo === 'CREDITO' ? 'Crédito' : 'Débito'}</small>
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
        <strong>{brl(total)}</strong>
      </div>

      {erro && <p className="erro">{erro}</p>}
      <button className="btn btn-pagar" disabled={!podePagar} onClick={pagar}>
        {e.processandoPagamento
          ? 'Processando…'
          : !e.cartao
            ? 'Cadastre um cartão para pagar'
            : precisaHorario
              ? 'Escolha um horário'
              : `Pagar ${brl(total)} em 1 clique`}
      </button>
    </aside>
  );
}
