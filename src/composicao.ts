import { Cozinha } from './domain/cozinha/Cozinha';
import type { Estacao } from './domain/cozinha/Estacao';
import { criarEstacoesPadrao } from './domain/cozinha/estacoes';
import { OrquestradorDaCozinha } from './domain/ia';
import type { GeradorDeCodigos } from './domain/portas/codigos';
import type { GatewayPagamento } from './domain/portas/pagamento';
import type { RelogioAjustavel } from './domain/portas/relogio';
import { AgendamentoService } from './domain/servicos/AgendamentoService';
import { CheckoutService } from './domain/servicos/CheckoutService';
import { EstoqueService } from './domain/servicos/EstoqueService';
import { PagamentoService } from './domain/servicos/PagamentoService';
import { PedidoService } from './domain/servicos/PedidoService';
import { RetiradaService } from './domain/servicos/RetiradaService';
import { Apresentador } from './app/Apresentador';
import { DemonstracaoDoSistema } from './app/DemonstracaoDoSistema';
import { FachadaDaCantina } from './app/FachadaDaCantina';
import type { Mundo } from './app/FachadaDaCantina';
import { PainelDaAtendente } from './app/PainelDaAtendente';
import { SessaoDoAluno } from './app/SessaoDoAluno';
import { CatalogoEmMemoria } from './infra/CatalogoEmMemoria';
import { criarCardapioInicial } from './infra/cardapioInicial';
import { GeradorDeCodigosAleatorios } from './infra/geradoresDeCodigo';
import { PagamentoSimulado } from './infra/PagamentoSimulado';
import { RepositorioPedidosEmMemoria } from './infra/RepositorioPedidosEmMemoria';
import { RelogioDoSistema } from './infra/relogios';

/** Peças que dá para trocar na hora de montar (testes, outro gateway, outra cozinha). */
export interface OpcoesDeComposicao {
  readonly gateway?: GatewayPagamento;
  readonly relogio?: RelogioAjustavel;
  readonly codigos?: GeradorDeCodigos;
  /** Estações da cozinha. Estação nova = adicionar uma linha em criarEstacoesPadrao(). */
  readonly estacoes?: readonly Estacao[];
}

/**
 * Raiz de composição: o ÚNICO lugar que conhece as classes concretas e liga tudo.
 * Domínio e aplicação só enxergam interfaces.
 */
export function montarMundo(opcoes: OpcoesDeComposicao = {}): Mundo {
  const relogio = opcoes.relogio ?? new RelogioDoSistema();
  const catalogo = new CatalogoEmMemoria(criarCardapioInicial());
  const repositorio = new RepositorioPedidosEmMemoria();
  const gateway = opcoes.gateway ?? new PagamentoSimulado();
  const codigos = opcoes.codigos ?? new GeradorDeCodigosAleatorios();
  const cozinha = new Cozinha(opcoes.estacoes ?? criarEstacoesPadrao());

  const estoque = new EstoqueService(catalogo);
  const agendamento = new AgendamentoService(catalogo, repositorio, relogio);
  const pagamento = new PagamentoService(gateway, relogio);
  const pedidos = new PedidoService(repositorio, codigos, relogio);
  const checkout = new CheckoutService(estoque, agendamento, pagamento, pedidos);
  const retirada = RetiradaService.padrao(repositorio);
  const orquestrador = new OrquestradorDaCozinha(cozinha);

  return {
    sessao: new SessaoDoAluno(estoque, agendamento, pagamento, checkout),
    painel: new PainelDaAtendente(pedidos, retirada, estoque),
    demo: new DemonstracaoDoSistema(relogio, checkout),
    apresentador: new Apresentador(catalogo, repositorio, agendamento, orquestrador, relogio),
  };
}

export function montarCantina(opcoes: OpcoesDeComposicao = {}): FachadaDaCantina {
  return new FachadaDaCantina(() => montarMundo(opcoes));
}
