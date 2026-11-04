import { describe, expect, it } from 'vitest';
import { montarCantina } from '../../composicao';
import { GeradorDeCodigosSequenciais } from '../../infra/geradoresDeCodigo';
import { PagamentoSimulado } from '../../infra/PagamentoSimulado';
import { RelogioFixo } from '../../infra/relogios';

const cartaoDeTeste = { titular: 'Ana Souza', numero: '4242 4242 4242 4242', validade: '12/30', cvv: '123', tipo: 'CREDITO' as const };

function nova() {
  return montarCantina({
    gateway: new PagamentoSimulado(0),
    relogio: new RelogioFixo(600, new Date(2026, 10, 3)),
    codigos: new GeradorDeCodigosSequenciais(),
  });
}

describe('FachadaDaCantina (fluxo completo, só pela interface que a tela usa)', () => {
  it('as operações funcionam mesmo desestruturadas (a tela recebe só a fatia que usa)', async () => {
    const { adicionar, cadastrarCartao, pagar, instantaneo } = nova();
    adicionar('agua');
    expect(cadastrarCartao(cartaoDeTeste).ok).toBe(true);
    expect((await pagar()).ok).toBe(true);
    expect(instantaneo().meusPedidos).toHaveLength(1);
  });

  it('cardápio traz as 4 categorias, incluindo os sucos do Liquidificador', () => {
    const c = nova().instantaneo();
    expect(c.cardapio.map((x) => x.id)).toEqual(['PRONTA_ENTREGA', 'FORNO', 'CHAPA', 'SUCO_NATURAL']);
    expect(c.cardapio.every((cat) => cat.produtos.length > 0)).toBe(true);
  });

  it('carrinho respeita o estoque e bloqueia o pagamento até ter cartão e horário', () => {
    const f = nova();
    expect(f.instantaneo().carrinho.bloqueio).toBe('CARRINHO_VAZIO');
    f.adicionar('cuscuz');
    expect(f.instantaneo().carrinho.bloqueio).toBe('SEM_CARTAO');
    expect(f.cadastrarCartao(cartaoDeTeste).ok).toBe(true);
    expect(f.instantaneo().carrinho.bloqueio).toBe('SEM_HORARIO');
    expect(f.instantaneo().carrinho.exigeHorario).toBe(true);
    const horario = f.instantaneo().carrinho.horarios.find((h) => h.disponivel)!;
    f.escolherHorario(horario.minuto);
    expect(f.instantaneo().carrinho.bloqueio).toBeNull();
    f.alterarQuantidade('cuscuz', 999);
    expect(f.instantaneo().cardapio[2].produtos.find((p) => p.id === 'cuscuz')?.quantidadeNoCarrinho).toBe(12);
  });

  it('cartão vencido é recusado na tela de cadastro', () => {
    const r = nova().cadastrarCartao({ ...cartaoDeTeste, validade: '10/26' });
    expect(r.ok).toBe(false);
  });

  it('pagar cria o pedido, esvazia o carrinho e baixa o estoque', async () => {
    const f = nova();
    f.adicionar('coxinha');
    f.adicionar('coxinha');
    f.cadastrarCartao(cartaoDeTeste);
    const r = await f.pagar();
    expect(r.ok).toBe(true);
    const i = f.instantaneo();
    expect(i.carrinho.itens).toEqual([]);
    expect(i.meusPedidos).toHaveLength(1);
    expect(i.meusPedidos[0].codigo).toBe('CNT-1001');
    expect(i.meusPedidos[0].textoDoQr).toBe('CANTINET|CNT-1001|P1');
    expect(i.meusPedidosAtivos).toBe(1);
    expect(i.cardapio[1].produtos.find((p) => p.id === 'coxinha')?.estoque).toBe(14);
    expect(i.painel.naFila).toHaveLength(1);
    expect(i.painel.plano.tarefas).toHaveLength(1);
  });

  it('durante o pagamento aparece "processando" e um segundo clique é recusado', async () => {
    const f = nova();
    f.adicionar('agua');
    f.cadastrarCartao(cartaoDeTeste);
    const vistos: (string | null)[] = [];
    f.inscrever(() => vistos.push(f.instantaneo().carrinho.bloqueio));
    const primeira = f.pagar();
    const segunda = await f.pagar();
    expect(segunda.ok).toBe(false);
    await primeira;
    expect(vistos).toContain('PROCESSANDO');
    expect(f.instantaneo().carrinho.processandoPagamento).toBe(false);
  });

  it('o retrato é imutável: cada mudança gera um novo e o antigo continua igual', () => {
    const f = nova();
    const antes = f.instantaneo();
    const copiaDoAntes = JSON.stringify(antes);
    f.adicionar('agua');
    const depois = f.instantaneo();
    expect(depois).not.toBe(antes);
    expect(depois.versao).toBeGreaterThan(antes.versao);
    expect(JSON.stringify(antes)).toBe(copiaDoAntes);
    expect(depois.carrinho.itens).toHaveLength(1);
  });

  it('a interface não recebe entidades do domínio, só dados simples (Demeter)', async () => {
    const f = nova();
    f.gerarPedidosDeDemonstracao();
    const i = f.instantaneo();
    const proto = (o: unknown) => Object.getPrototypeOf(o) as unknown;
    const soDados = (o: unknown): boolean => {
      if (o === null || typeof o !== 'object') return true;
      const p = proto(o);
      if (p !== Object.prototype && p !== Array.prototype) return false;
      return Object.values(o as object).every(soDados);
    };
    expect(soDados(i)).toBe(true);
  });

  it('atendente: pedido vai da fila até pronto e a retirada por QR entrega e não repete', () => {
    const f = nova();
    f.gerarPedidosDeDemonstracao();
    const pedido = f.instantaneo().painel.naFila[0];
    f.avancarPedido(pedido.id);
    f.avancarPedido(pedido.id);
    expect(f.instantaneo().painel.prontos.map((p) => p.id)).toContain(pedido.id);
    const r = f.confirmarRetirada('qrcode', pedido.textoDoQr);
    expect(r.ok).toBe(true);
    expect(f.instantaneo().painel.entregues).toBe(1);
    const de_novo = f.confirmarRetirada('qrcode', pedido.textoDoQr);
    expect(de_novo.ok).toBe(false);
  });

  it('QR de pedido que não está pronto é recusado; código digitado também funciona', () => {
    const f = nova();
    f.gerarPedidosDeDemonstracao();
    const p = f.instantaneo().painel.naFila[0];
    const r = f.confirmarRetirada('qrcode', p.textoDoQr);
    expect(r.ok).toBe(false);
    f.avancarPedido(p.id);
    f.avancarPedido(p.id);
    expect(f.confirmarRetirada('codigo', ` ${p.codigo.toLowerCase()} `).ok).toBe(true);
  });

  it('repor estoque, adiantar relógio e reiniciar', () => {
    const f = nova();
    const antes = f.instantaneo().painel.estoque[0].produtos[0].estoque;
    f.reporEstoque(f.instantaneo().painel.estoque[0].produtos[0].id, 5);
    expect(f.instantaneo().painel.estoque[0].produtos[0].estoque).toBe(antes + 5);
    f.adiantarRelogio(5);
    expect(f.instantaneo().agoraMin).toBe(605);
    f.gerarPedidosDeDemonstracao();
    expect(f.instantaneo().painel.naFila.length).toBeGreaterThan(0);
    f.reiniciar();
    expect(f.instantaneo().painel.naFila).toHaveLength(0);
    expect(f.instantaneo().painel.estoque[0].produtos[0].estoque).toBe(antes);
  });

  it('o suco do Liquidificador entra na linha do tempo sem mudar a IA', () => {
    const f = nova();
    f.gerarPedidosDeDemonstracao();
    const estacoes = new Set(f.instantaneo().painel.plano.tarefas.map((t) => t.estacao));
    expect(estacoes.has('liquidificador')).toBe(true);
  });
});
