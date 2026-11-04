import type { Cartao } from './types';
import { validarValidade } from './cartao';

export interface DadosCartao {
  titular: string;
  numero: string;
  validade: string;
  cvv: string;
  tipo: 'CREDITO' | 'DEBITO';
}

export function detectarBandeira(numero: string): string {
  const n = numero.replace(/\D/g, '');
  if (n.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(n)) return 'Elo';
  return 'Cartão';
}

/** `agora` existe para os testes poderem fixar a data. */
export function validarCartao(d: DadosCartao, agora: Date = new Date()): string | null {
  if (d.titular.trim().length < 3) return 'Informe o nome impresso no cartão.';
  const n = d.numero.replace(/\D/g, '');
  if (n.length < 13 || n.length > 19) return 'Número de cartão inválido.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.validade)) return 'Validade deve ser MM/AA.';
  // Correção da Entrega 2: antes, cartão vencido era aceito.
  const validade = validarValidade(d.validade, agora);
  if (!validade.ok) return validade.erro;
  if (!/^\d{3,4}$/.test(d.cvv)) return 'CVV inválido.';
  return null;
}

/** Guarda apenas o que e seguro exibir: nunca o numero completo nem o CVV. */
export function tokenizarCartao(d: DadosCartao): Cartao {
  const n = d.numero.replace(/\D/g, '');
  return {
    titular: d.titular.trim().toUpperCase(),
    ultimos4: n.slice(-4),
    bandeira: detectarBandeira(n),
    validade: d.validade,
    tipo: d.tipo,
  };
}

export interface ResultadoCobranca {
  ok: boolean;
  erro?: string;
  comprovante?: string;
}
