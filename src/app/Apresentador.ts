import type { Pedido } from '../domain/modelos/Pedido';
import type { Produto } from '../domain/modelos/Produto';
import type { LeituraDeEstoque } from '../domain/portas/estoque';
import type { ConsultaDePedidos } from '../domain/portas/pedidos';
import type { Relogio } from '../domain/portas/relogio';
import type { OrquestradorDaCozinha } from '../domain/ia';
import type { AgendamentoService } from '../domain/servicos/AgendamentoService';
import { totalDosItens } from '../domain/pedidos';
import { CATEGORIAS, ROTULO_STATUS } from './categorias';
import type { EstadoDaSessao } from './SessaoDoAluno';
import type {
  BloqueioDoPagamento,
  CarrinhoVisao,
  CategoriaVisao,
  Instantaneo,
  PainelVisao,
  PedidoVisao,
  ProdutoVisao,
} from './visoes';

const classeDaCategoria = new Map(CATEGORIAS.map((c) => [c.id as string, c.classe]));

/** Traduz o domínio em visões simples. É o único lugar que conhece os dois lados (Demeter). */
export class Apresentador {
  constructor(
    private readonly catalogo: LeituraDeEstoque,
    private readonly pedidos: ConsultaDePedidos,
    private readonly agendamento: AgendamentoService,
    private readonly orquestrador: OrquestradorDaCozinha,
    private readonly relogio: Relogio,
  ) {}

  instantaneo(sessao: EstadoDaSessao, versao: number): Instantaneo {
    const agoraMin = this.relogio.agoraEmMin();
    const meus = this.pedidos.doAluno(sessao.aluno);
    return {
      versao,
      agoraMin,
      cardapio: this.cardapio(sessao),
      carrinho: this.carrinho(sessao),
      meusPedidos: [...meus].reverse().map((p) => this.pedido(p)),
      meusPedidosAtivos: meus.filter((p) => !p.foiEntregue()).length,
      painel: this.painel(agoraMin),
    };
  }

  private cardapio(sessao: EstadoDaSessao): CategoriaVisao[] {
    return CATEGORIAS.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      descricao: c.descricao,
      icone: c.icone,
      classe: c.classe,
      produtos: this.catalogo
        .produtos()
        .filter((p) => p.categoria === c.id)
        .map((p) => this.produto(p, c.unidade, sessao.carrinho.quantidadeDe(p.id))),
    }));
  }

  private produto(p: Produto, unidade: string, noCarrinho: number): ProdutoVisao {
    return {
      id: p.id,
      nome: p.nome,
      emoji: p.emoji,
      preco: p.preco,
      tempoPreparoMin: p.tempoPreparoMin,
      estoque: p.estoque,
      unidade,
      nivelDoEstoque: p.estoque === 0 ? 'zero' : p.estoque <= 3 ? 'baixo' : 'ok',
      quantidadeNoCarrinho: noCarrinho,
      podeAumentar: noCarrinho < p.estoque,
    };
  }

  private carrinho(sessao: EstadoDaSessao): CarrinhoVisao {
    const itens = this.agendamento.itensDoCarrinho(sessao.carrinho);
    const opcoes = this.agendamento.opcoesPara(sessao.carrinho);
    const cartao = sessao.cartao;
    let bloqueio: BloqueioDoPagamento | null = null;
    if (itens.length === 0) bloqueio = 'CARRINHO_VAZIO';
    else if (!cartao) bloqueio = 'SEM_CARTAO';
    else if (opcoes.exigeHorario && sessao.horarioEscolhido === null) bloqueio = 'SEM_HORARIO';
    else if (sessao.processandoPagamento) bloqueio = 'PROCESSANDO';
    return {
      itens: itens.map((i) => ({ produtoId: i.produtoId, nome: i.nome, emoji: i.emoji, quantidade: i.quantidade, subtotal: i.precoUnit * i.quantidade })),
      quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0),
      total: totalDosItens(itens),
      exigeHorario: opcoes.exigeHorario,
      horarios: opcoes.horarios.map((h) => ({ minuto: h.minuto, vagas: h.vagas, disponivel: h.disponivel })),
      horarioEscolhido: sessao.horarioEscolhido,
      retiradaPrevista: opcoes.retiradaPrevista,
      cartao: cartao ? { descricao: `${cartao.bandeira} •••• ${cartao.ultimos4}`, bandeira: cartao.bandeira, ultimos4: cartao.ultimos4, tipo: cartao.tipo } : null,
      processandoPagamento: sessao.processandoPagamento,
      bloqueio,
    };
  }

  private pedido(p: Pedido): PedidoVisao {
    return {
      id: p.id,
      codigo: p.codigo,
      aluno: p.aluno,
      status: p.status,
      rotuloDoStatus: ROTULO_STATUS[p.status],
      retiradaMin: p.retiradaMin,
      itens: p.itens.map((i) => ({ produtoId: i.produtoId, nome: i.nome, emoji: i.emoji, quantidade: i.quantidade, classeDaCategoria: classeDaCategoria.get(i.categoria) ?? '' })),
      total: p.total,
      pagoCom: p.pagoCom,
      textoDoQr: `CANTINET|${p.codigo}|${p.id}`,
    };
  }

  private painel(agoraMin: number): PainelVisao {
    const todos = this.pedidos.todos();
    const porRetirada = (a: Pedido, b: Pedido) => a.retiradaMin - b.retiradaMin;
    const doStatus = (s: Pedido['status']) => todos.filter((p) => p.status === s).sort(porRetirada).map((p) => this.pedido(p));
    const entregues = todos.filter((p) => p.foiEntregue()).length;
    return {
      naFila: doStatus('AGUARDANDO'),
      emPreparo: doStatus('EM_PREPARO'),
      prontos: doStatus('PRONTO'),
      entregues,
      emAndamento: todos.length - entregues,
      plano: this.orquestrador.planejar(todos, agoraMin),
      estoque: CATEGORIAS.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        descricao: c.descricao,
        icone: c.icone,
        classe: c.classe,
        produtos: this.catalogo.produtos().filter((p) => p.categoria === c.id).map((p) => this.produto(p, c.unidade, 0)),
      })),
    };
  }
}
