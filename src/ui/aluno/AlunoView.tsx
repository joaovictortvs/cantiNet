import { useState } from 'react';
import { ALUNO_ATUAL, useEstado } from '../../store/store';
import { CardapioView } from './CardapioView';
import { CarrinhoPanel } from './CarrinhoPanel';
import { MeusPedidos } from './MeusPedidos';

type Aba = 'cardapio' | 'pedidos';

export function AlunoView() {
  const e = useEstado();
  const [aba, setAba] = useState<Aba>('cardapio');
  const ativos = e.pedidos.filter((p) => p.aluno === ALUNO_ATUAL && p.status !== 'ENTREGUE').length;
  const itensNoCarrinho = e.carrinho.reduce((s, i) => s + i.quantidade, 0);

  return (
    <section>
      <div className="abas">
        <button className={aba === 'cardapio' ? 'ativa' : ''} onClick={() => setAba('cardapio')}>
          Cardápio {itensNoCarrinho > 0 && <span className="selo">{itensNoCarrinho}</span>}
        </button>
        <button className={aba === 'pedidos' ? 'ativa' : ''} onClick={() => setAba('pedidos')}>
          Meus pedidos {ativos > 0 && <span className="selo">{ativos}</span>}
        </button>
      </div>

      {aba === 'cardapio' ? (
        <>
          <div className="hero">
            <div>
              <h2>Intervalo curto? Peça antes.</h2>
              <p>Com a CantiNet você monta o pedido, paga com 1 clique e retira só mostrando o QR Code no balcão.</p>
            </div>
            <ol className="hero-passos">
              <li>
                <b>1</b> Escolha
              </li>
              <li>
                <b>2</b> Pague
              </li>
              <li>
                <b>3</b> Retire
              </li>
            </ol>
          </div>
          <div className="layout-aluno">
            <CardapioView />
            <CarrinhoPanel onPago={() => setAba('pedidos')} />
          </div>
          {itensNoCarrinho > 0 && (
            <a className="fab-carrinho" href="#carrinho">
              🛒 Ver pedido · {itensNoCarrinho}
            </a>
          )}
        </>
      ) : (
        <MeusPedidos />
      )}
    </section>
  );
}
