export interface Validade {
  mes: number; // 1-12
  ano: number; // 4 dígitos
}

export type ResultadoValidade = { ok: true } | { ok: false; erro: string };

/** Aceita "MM/AA" ou "MM/AAAA". */
export function parseValidade(texto: string): Validade | null {
  const m = /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const mes = Number(m[1]);
  let ano = Number(m[2]);
  if (m[2].length === 2) ano += 2000;
  if (mes < 1 || mes > 12) return null;
  return { mes, ano };
}

/**
 * O cartão vale até o ÚLTIMO dia do mês de validade.
 * (Correção do bug da Entrega 1: cartão vencido era aceito.)
 */
export function validarValidade(texto: string, agora: Date = new Date()): ResultadoValidade {
  const v = parseValidade(texto);
  if (!v) return { ok: false, erro: "Validade inválida. Use o formato MM/AA." };

  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;

  if (v.ano > anoAtual + 20) return { ok: false, erro: "Validade muito distante. Confira a data do cartão." };
  if (v.ano < anoAtual || (v.ano === anoAtual && v.mes < mesAtual))
    return { ok: false, erro: "Cartão vencido. Cadastre um cartão dentro da validade." };

  return { ok: true };
}
