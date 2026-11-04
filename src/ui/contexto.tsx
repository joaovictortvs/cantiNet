import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { FachadaDaCantina } from '../app/FachadaDaCantina';
import type {
  FerramentasDeDemonstracao,
  OperacoesDaCozinha,
  OperacoesDeEstoque,
  OperacoesDePagamento,
  OperacoesDoCarrinho,
} from '../app/operacoes';
import type { CarrinhoVisao, CategoriaVisao, Instantaneo, PainelVisao, PedidoVisao } from '../app/visoes';

const Contexto = createContext<FachadaDaCantina | null>(null);

/** Entrega a cantina (já montada na composição) para a árvore de componentes. */
export function ProvedorDaCantina({ cantina, children }: { cantina: FachadaDaCantina; children: ReactNode }) {
  // O relógio anda sozinho: recalcula o retrato a cada 10 s.
  useEffect(() => {
    const t = setInterval(() => cantina.atualizar(), 10000);
    return () => clearInterval(t);
  }, [cantina]);
  return <Contexto.Provider value={cantina}>{children}</Contexto.Provider>;
}

function useFachada(): FachadaDaCantina {
  const f = useContext(Contexto);
  if (!f) throw new Error('Envolva o app em <ProvedorDaCantina>.');
  return f;
}

function useInstantaneo(): Instantaneo {
  const f = useFachada();
  return useSyncExternalStore(f.inscrever, f.instantaneo);
}

/**
 * Cada hook devolve só a FATIA e só as OPERAÇÕES do seu papel (Segregação de Interfaces):
 * quem mostra o cardápio não recebe o painel da atendente, e vice-versa.
 */
export function useRelogio(): number {
  return useInstantaneo().agoraMin;
}

export function useCardapio(): { categorias: readonly CategoriaVisao[]; operacoes: OperacoesDoCarrinho } {
  return { categorias: useInstantaneo().cardapio, operacoes: useFachada() };
}

export function useCarrinho(): { carrinho: CarrinhoVisao; agoraMin: number; carrinhoOps: OperacoesDoCarrinho; pagamentoOps: OperacoesDePagamento } {
  const i = useInstantaneo();
  const f = useFachada();
  return { carrinho: i.carrinho, agoraMin: i.agoraMin, carrinhoOps: f, pagamentoOps: f };
}

export function useCadastroDeCartao(): Pick<OperacoesDePagamento, 'cadastrarCartao'> {
  return useFachada();
}

export function useResumoDoAluno(): { itensNoCarrinho: number; pedidosAtivos: number } {
  const i = useInstantaneo();
  return { itensNoCarrinho: i.carrinho.quantidadeTotal, pedidosAtivos: i.meusPedidosAtivos };
}

export function useMeusPedidos(): readonly PedidoVisao[] {
  return useInstantaneo().meusPedidos;
}

export function usePainel(): { painel: PainelVisao; agoraMin: number; cozinha: OperacoesDaCozinha; estoque: OperacoesDeEstoque } {
  const i = useInstantaneo();
  const f = useFachada();
  return { painel: i.painel, agoraMin: i.agoraMin, cozinha: f, estoque: f };
}

export function useDemonstracao(): FerramentasDeDemonstracao {
  return useFachada();
}
