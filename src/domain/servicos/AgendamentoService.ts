import { calcularRetiradaSemChapa, gerarSlots, temItemDeChapa } from '../agendamento';
import type { Slot } from '../agendamento';
import { montarItens } from '../pedidos';
import type { LeituraDoCarrinho } from '../modelos/Carrinho';
import type { LeituraDeEstoque } from '../portas/estoque';
import type { ConsultaDePedidos } from '../portas/pedidos';
import type { Relogio } from '../portas/relogio';

export interface OpcoesDeRetirada {
  /** Há item que exige escolher um horário (chapa)? */
  readonly exigeHorario: boolean;
  readonly horarios: readonly Slot[];
  /** Quando não há horário a escolher: quando o pedido fica pronto. */
  readonly retiradaPrevista: number | null;
}

/** Regras de horário de retirada, sobre o carrinho atual, os pedidos existentes e o relógio. */
export class AgendamentoService {
  constructor(
    private readonly catalogo: LeituraDeEstoque,
    private readonly pedidos: ConsultaDePedidos,
    private readonly relogio: Relogio,
  ) {}

  opcoesPara(carrinho: LeituraDoCarrinho): OpcoesDeRetirada {
    const produtos = this.catalogo.produtos();
    const agora = this.relogio.agoraEmMin();
    if (carrinho.estaVazio()) return { exigeHorario: false, horarios: [], retiradaPrevista: null };
    if (temItemDeChapa(produtos, carrinho.itens)) {
      return { exigeHorario: true, horarios: gerarSlots(agora, produtos, carrinho.itens, this.pedidos.todos()), retiradaPrevista: null };
    }
    return { exigeHorario: false, horarios: [], retiradaPrevista: calcularRetiradaSemChapa(agora, produtos, carrinho.itens) };
  }

  /** O horário escolhido ainda vale agora (não lotou, não passou)? */
  horarioContinuaValido(carrinho: LeituraDoCarrinho, minuto: number | null): boolean {
    if (minuto === null) return false;
    return this.opcoesPara(carrinho).horarios.some((h) => h.minuto === minuto && h.disponivel);
  }

  itensDoCarrinho(carrinho: LeituraDoCarrinho) {
    return montarItens(this.catalogo.produtos(), carrinho.itens);
  }
}
