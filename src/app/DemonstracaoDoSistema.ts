import { Carrinho } from '../domain/modelos/Carrinho';
import type { CheckoutService } from '../domain/servicos/CheckoutService';
import type { RelogioAjustavel } from '../domain/portas/relogio';
import { arredondarParaCima } from '../domain/tempo';

type Par = readonly [produtoId: string, quantidade: number];

/** Atalhos para a gravação do vídeo: adiantar o relógio e injetar pedidos já pagos. */
export class DemonstracaoDoSistema {
  constructor(
    private readonly relogio: RelogioAjustavel,
    private readonly checkout: CheckoutService,
  ) {}

  adiantarRelogio(minutos: number): void {
    this.relogio.adiantar(minutos);
  }

  gerarPedidos(): void {
    const base = arredondarParaCima(this.relogio.agoraEmMin() + 12, 5);
    const demos: { aluno: string; itens: Par[]; retirada: number }[] = [
      { aluno: 'Ana', retirada: base, itens: [['tapioca-queijo', 2], ['coxinha', 1], ['brigadeiro', 1]] },
      { aluno: 'Bruno', retirada: base, itens: [['cuscuz', 1], ['enroladinho', 2], ['suco', 1], ['suco-laranja', 1]] },
      { aluno: 'Carla', retirada: base + 5, itens: [['sanduiche', 1], ['coxinha', 2]] },
    ];
    for (const d of demos) {
      const carrinho = new Carrinho();
      for (const [id, q] of d.itens) carrinho.definirQuantidade(id, q);
      this.checkout.registrarPedidoPago(d.aluno, carrinho, d.retirada, 'Visa •••• 4242'); // sem estoque? só pula
    }
  }
}
