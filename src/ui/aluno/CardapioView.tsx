import type { OperacoesDoCarrinho } from '../../app/operacoes';
import type { ProdutoVisao } from '../../app/visoes';
import { brl } from '../../compartilhado/formatar';
import { useCardapio } from '../contexto';

function rotuloEstoque(p: ProdutoVisao): string {
  if (p.nivelDoEstoque === 'zero') return 'Esgotado';
  if (p.nivelDoEstoque === 'baixo') return `Últimas ${p.estoque} ${p.unidade}`;
  return `${p.estoque} ${p.unidade}`;
}

type Operacoes = Pick<OperacoesDoCarrinho, 'adicionar' | 'alterarQuantidade'>;

function ProdutoCard({ produto, operacoes }: { produto: ProdutoVisao; operacoes: Operacoes }) {
  const qtd = produto.quantidadeNoCarrinho;
  const esgotado = produto.nivelDoEstoque === 'zero';

  return (
    <article className={`produto ${esgotado ? 'esgotado' : ''}`}>
      <div className="produto-emoji" aria-hidden>
        {produto.emoji}
      </div>
      <div className="produto-info">
        <h4>{produto.nome}</h4>
        <div className="produto-linha">
          <strong>{brl(produto.preco)}</strong>
          {produto.tempoPreparoMin > 0 && <span className="tempo">⏱ {produto.tempoPreparoMin} min</span>}
        </div>
        <span className={`estoque estoque-${produto.nivelDoEstoque}`}>{rotuloEstoque(produto)}</span>
      </div>
      <div className="produto-acao">
        {qtd === 0 ? (
          <button className="btn btn-primario" disabled={esgotado} onClick={() => operacoes.adicionar(produto.id)}>
            Adicionar
          </button>
        ) : (
          <div className="stepper">
            <button aria-label={`Remover ${produto.nome}`} onClick={() => operacoes.alterarQuantidade(produto.id, -1)}>
              −
            </button>
            <span>{qtd}</span>
            <button
              aria-label={`Adicionar ${produto.nome}`}
              disabled={!produto.podeAumentar}
              onClick={() => operacoes.alterarQuantidade(produto.id, 1)}
            >
              +
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function CardapioView() {
  const { categorias, operacoes } = useCardapio();
  return (
    <div className="cardapio">
      {categorias.map((cat) => (
        <section key={cat.id} className={`categoria ${cat.classe}`}>
          <header className="categoria-topo">
            <span className="categoria-icone">{cat.icone}</span>
            <div>
              <h3>{cat.titulo}</h3>
              <p>{cat.descricao}</p>
            </div>
          </header>
          <div className="grade-produtos">
            {cat.produtos.map((p) => (
              <ProdutoCard key={p.id} produto={p} operacoes={operacoes} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
