import { useState } from 'react';
import { useResumoDoAluno } from '../contexto';
import { CardapioView } from './CardapioView';
import { CarrinhoPanel } from './CarrinhoPanel';
import { MeusPedidos } from './MeusPedidos';

type Aba = 'cardapio' | 'pedidos';

export function AlunoView() {
  const { itensNoCarrinho, pedidosAtivos: ativos } = useResumoDoAluno();
  const [aba, setAba] = useState<Aba>('cardapio');

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
        <div className="layout-aluno">
          <CardapioView />
          <CarrinhoPanel onPago={() => setAba('pedidos')} />
        </div>
      ) : (
        <MeusPedidos />
      )}
    </section>
  );
}
