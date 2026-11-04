import { describe, expect, it } from 'vitest';
import { Carrinho } from '../modelos/Carrinho';
import { Produto } from '../modelos/Produto';
import type { GatewayPagamento, ResultadoEstorno } from '../portas/pagamento';
import type { LeituraDeEstoque } from '../portas/estoque';
import type { ResultadoCobranca } from '../pagamento';
import { AgendamentoService } from '../servicos/AgendamentoService';
import { CheckoutService, ESTOQUE_ESGOTADO_NO_PAGAMENTO, HORARIO_INDISPONIVEL } from '../servicos/CheckoutService';
import { EstoqueService } from '../servicos/EstoqueService';
import { PagamentoService } from '../servicos/PagamentoService';
import { PedidoService } from '../servicos/PedidoService';
import type { Cartao } from '../types';
import { RepositorioPedidosEmMemoria } from '../../infra/RepositorioPedidosEmMemoria';
import { GeradorDeCodigosSequenciais } from '../../infra/geradoresDeCodigo';
import { RelogioFixo } from '../../infra/relogios';

/** Catálogo falso: prova que os serviços só dependem da interface (DIP). */
class CatalogoFalso implements LeituraDeEstoque {
  readonly lista = [
    new Produto({ id: 'coxinha', nome: 'Coxinha', categoria: 'FORNO', preco: 7, emoji: '🍗', estoque: 5, tempoPreparoMin: 8 }),
    new Produto({ id: 'cuscuz', nome: 'Cuscuz', categoria: 'CHAPA', preco: 9, emoji: '🍳', estoque: 12, tempoPreparoMin: 5 }),
    new Produto({ id: 'agua', nome: 'Água', categoria: 'PRONTA_ENTREGA', preco: 3, emoji: '💧', estoque: 9, tempoPreparoMin: 0 }),
  ];
  produtos() {
    return this.lista;
  }
  produto(id: string) {
    return this.lista.find((p) => p.id === id);
  }
}

/** Gateway falso que registra o que o domínio pediu e permite "esgotar" o estoque durante a cobrança. */
class GatewayFalso implements GatewayPagamento {
  cobrancas: number[] = [];
  estornos: { comprovante: string; valor: number }[] = [];
  aoCobrar: () => void = () => undefined;
  estornoFunciona = true;
  async cobrar(_c: Cartao, valor: number): Promise<ResultadoCobranca> {
    this.cobrancas.push(valor);
    this.aoCobrar();
    return { ok: true, comprovante: 'AUT-TESTE' };
  }
  async estornar(comprovante: string, valor: number): Promise<ResultadoEstorno> {
    if (!this.estornoFunciona) return { ok: false, erro: 'gateway fora do ar' };
    this.estornos.push({ comprovante, valor });
    return { ok: true, comprovante: 'EST-TESTE' };
  }
}

const dadosDoCartao = { titular: 'Ana Souza', numero: '4242424242424242', validade: '12/30', cvv: '123', tipo: 'CREDITO' as const };

function montar(agora = 600) {
  const catalogo = new CatalogoFalso();
  const repositorio = new RepositorioPedidosEmMemoria();
  const relogio = new RelogioFixo(agora, new Date(2026, 10, 3));
  const gateway = new GatewayFalso();
  const estoque = new EstoqueService(catalogo);
  const agendamento = new AgendamentoService(catalogo, repositorio, relogio);
  const pagamento = new PagamentoService(gateway, relogio);
  const pedidos = new PedidoService(repositorio, new GeradorDeCodigosSequenciais(), relogio);
  const checkout = new CheckoutService(estoque, agendamento, pagamento, pedidos);
  const cartao = (() => {
    const r = pagamento.cadastrarCartao(dadosDoCartao);
    if (!r.ok) throw new Error(r.erro);
    return r.valor;
  })();
  const carrinhoCom = (...itens: [string, number][]) => {
    const c = new Carrinho();
    for (const [id, q] of itens) c.definirQuantidade(id, q);
    return c;
  };
  return { catalogo, repositorio, gateway, estoque, agendamento, pagamento, pedidos, checkout, cartao, carrinhoCom };
}

describe('PagamentoService', () => {
  it('recusa cartão vencido usando a data do relógio injetado', () => {
    const { pagamento } = montar();
    const r = pagamento.cadastrarCartao({ ...dadosDoCartao, validade: '10/26' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro).toBe('Cartão vencido. Cadastre um cartão dentro da validade.');
    expect(pagamento.cadastrarCartao({ ...dadosDoCartao, validade: '11/26' }).ok).toBe(true);
  });

  it('o cartão guardado traz só bandeira e 4 últimos dígitos', () => {
    const { cartao } = montar();
    expect(cartao.ultimos4).toBe('4242');
    expect(JSON.stringify(cartao)).not.toContain('4242 4242');
    expect(JSON.stringify(cartao)).not.toContain('123');
  });
});

describe('CheckoutService', () => {
  it('cobra, baixa o estoque e cria o pedido aguardando', async () => {
    const t = montar();
    const r = await t.checkout.finalizar({ aluno: 'Ana', carrinho: t.carrinhoCom(['coxinha', 2], ['agua', 1]), cartao: t.cartao, horarioEscolhido: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(t.gateway.cobrancas).toEqual([17]);
    expect(r.valor.status).toBe('AGUARDANDO');
    expect(r.valor.codigo).toBe('CNT-1001');
    expect(r.valor.retiradaMin).toBe(608);
    expect(r.valor.pagoCom).toBe('Visa •••• 4242');
    expect(t.catalogo.produto('coxinha')?.estoque).toBe(3);
    expect(t.repositorio.todos()).toHaveLength(1);
  });

  it('sem cartão, carrinho vazio e chapa sem horário: recusa antes de cobrar', async () => {
    const t = montar();
    const msg = async (c: Carrinho, cartao: Cartao | null) => {
      const r = await t.checkout.finalizar({ aluno: 'A', carrinho: c, cartao, horarioEscolhido: null });
      return r.ok ? '' : r.erro;
    };
    expect(await msg(t.carrinhoCom(['agua', 1]), null)).toBe('Cadastre um cartão para pagar.');
    expect(await msg(t.carrinhoCom(), t.cartao)).toBe('Seu carrinho está vazio.');
    expect(await msg(t.carrinhoCom(['cuscuz', 1]), t.cartao)).toBe('Escolha o horário de retirada.');
    expect(t.gateway.cobrancas).toEqual([]);
  });

  it('horário que lotou: recusa com código próprio e não cobra', async () => {
    const t = montar();
    const primeiro = await t.checkout.finalizar({ aluno: 'B', carrinho: t.carrinhoCom(['cuscuz', 4]), cartao: t.cartao, horarioEscolhido: 610 });
    expect(primeiro.ok).toBe(true);
    const r = await t.checkout.finalizar({ aluno: 'A', carrinho: t.carrinhoCom(['cuscuz', 1]), cartao: t.cartao, horarioEscolhido: 610 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.codigo).toBe(HORARIO_INDISPONIVEL);
      expect(r.erro).toBe('Esse horário acabou de lotar. Escolha outro.');
    }
    expect(t.gateway.cobrancas).toHaveLength(1);
  });

  it('estoque acabou durante o pagamento: chama o estorno de verdade e só então mostra a mensagem de estorno', async () => {
    const t = montar();
    t.gateway.aoCobrar = () => t.catalogo.produto('coxinha')?.baixar(5);
    const r = await t.checkout.finalizar({ aluno: 'A', carrinho: t.carrinhoCom(['coxinha', 1]), cartao: t.cartao, horarioEscolhido: null });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.codigo).toBe(ESTOQUE_ESGOTADO_NO_PAGAMENTO);
    expect(t.gateway.estornos).toEqual([{ comprovante: 'AUT-TESTE', valor: 7 }]);
    expect(r.erro).toContain('O estoque acabou durante o pagamento.');
    expect(r.erro).toContain('Estorno de');
    expect(r.erro).toContain('final 4242');
    expect(t.repositorio.todos()).toHaveLength(0);
  });

  it('se o estorno falhar, a mensagem NÃO afirma que o estorno foi feito e traz o comprovante', async () => {
    const t = montar();
    t.gateway.estornoFunciona = false;
    t.gateway.aoCobrar = () => t.catalogo.produto('coxinha')?.baixar(5);
    const r = await t.checkout.finalizar({ aluno: 'A', carrinho: t.carrinhoCom(['coxinha', 1]), cartao: t.cartao, horarioEscolhido: null });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.erro).not.toContain('Estorno de');
    expect(r.erro).toContain('Não foi possível concluir o estorno');
    expect(r.erro).toContain('AUT-TESTE');
  });
});

describe('EstoqueService e PedidoService', () => {
  it('limita o carrinho ao que existe e explica esgotado / poucas unidades', () => {
    const t = montar();
    const c = new Carrinho();
    t.estoque.alterarQuantidade(c, 'coxinha', 99);
    expect(c.quantidadeDe('coxinha')).toBe(5);
    t.catalogo.produto('coxinha')?.baixar(5);
    expect(t.estoque.problemasDo(c)).toEqual(['Coxinha esgotou.']);
    t.estoque.repor('coxinha', 3);
    expect(t.estoque.problemasDo(c)).toEqual(['Coxinha: só restam 3 unidade(s).']);
  });

  it('baixa é tudo ou nada', () => {
    const t = montar();
    const r = t.estoque.baixar([{ produtoId: 'agua', quantidade: 2 }, { produtoId: 'coxinha', quantidade: 50 }]);
    expect(r.ok).toBe(false);
    expect(t.catalogo.produto('agua')?.estoque).toBe(9);
  });

  it('avançar um pedido inexistente falha sem lançar erro', () => {
    expect(montar().pedidos.avancar('nada').ok).toBe(false);
  });
});
