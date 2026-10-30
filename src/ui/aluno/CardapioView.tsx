import { quantidadeNoCarrinho } from '../../domain/estoque';
import type { Produto } from '../../domain/types';
import { acoes, useEstado } from '../../store/store';
import { META_CATEGORIA, ORDEM_CATEGORIAS } from '../categorias';
import { brl } from '../formatar';

function rotuloEstoque(p: Produto): { texto: string; nivel: 'ok' | 'baixo' | 'zero' } {
  const un = META_CATEGORIA[p.categoria].unidade;
  if (p.estoque === 0) return { texto: 'Esgotado', nivel: 'zero' };
  if (p.estoque <= 3) return { texto: `Últimas ${p.estoque} ${un}`, nivel: 'baixo' };
  return { texto: `${p.estoque} ${un}`, nivel: 'ok' };
}

function ProdutoCard({ produto }: { produto: Produto }) {
  const e = useEstado();
  const qtd = quantidadeNoCarrinho(e.carrinho, produto.id);
  const esgotado = produto.estoque === 0;
  const { texto, nivel } = rotuloEstoque(produto);

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
        <span className={`estoque estoque-${nivel}`}>{texto}</span>
      </div>
      <div className="produto-acao">
        {qtd === 0 ? (
          <button className="btn btn-primario" disabled={esgotado} onClick={() => acoes.adicionarAoCarrinho(produto.id)}>
            Adicionar
          </button>
        ) : (
          <div className="stepper">
            <button aria-label={`Remover ${produto.nome}`} onClick={() => acoes.alterarQuantidade(produto.id, -1)}>
              −
            </button>
            <span>{qtd}</span>
            <button
              aria-label={`Adicionar ${produto.nome}`}
              disabled={qtd >= produto.estoque}
              onClick={() => acoes.alterarQuantidade(produto.id, 1)}
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
  const e = useEstado();
  return (
    <div className="cardapio">
      <nav className="chips-categorias" aria-label="Ir para categoria">
        {ORDEM_CATEGORIAS.map((cat) => {
          const meta = META_CATEGORIA[cat];
          const total = e.produtos.filter((p) => p.categoria === cat).reduce((s, p) => s + p.estoque, 0);
          return (
            <a key={cat} href={`#cat-${cat}`} className={`chip-cat ${meta.classe}`}>
              <span aria-hidden="true">{meta.icone}</span> {meta.titulo.split(' ·')[0]} <small>{total}</small>
            </a>
          );
        })}
      </nav>
      {ORDEM_CATEGORIAS.map((cat) => {
        const meta = META_CATEGORIA[cat];
        const itens = e.produtos.filter((p) => p.categoria === cat);
        return (
          <section key={cat} id={`cat-${cat}`} className={`categoria ${meta.classe}`}>
            <header className="categoria-topo">
              <span className="categoria-icone">{meta.icone}</span>
              <div>
                <h3>{meta.titulo}</h3>
                <p>{meta.descricao}</p>
              </div>
            </header>
            <div className="grade-produtos">
              {itens.map((p) => (
                <ProdutoCard key={p.id} produto={p} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
