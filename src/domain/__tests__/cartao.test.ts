import { describe, it, expect } from "vitest";
import { parseValidade, validarValidade } from "../cartao";
import { mensagemEstorno } from "../estorno";

const HOJE = new Date(2026, 10, 3); // 03/11/2026

describe("validade do cartão", () => {
  it("aceita MM/AA e MM/AAAA", () => {
    expect(parseValidade("12/28")).toEqual({ mes: 12, ano: 2028 });
    expect(parseValidade("01/2030")).toEqual({ mes: 1, ano: 2030 });
  });
  it("rejeita formato e mês inválidos", () => {
    expect(parseValidade("13/28")).toBeNull();
    expect(parseValidade("abc")).toBeNull();
    expect(parseValidade("00/28")).toBeNull();
  });
  it("rejeita cartão vencido (bug da Entrega 1)", () => {
    const r = validarValidade("10/26", HOJE);
    expect(r.ok).toBe(false);
    const r2 = validarValidade("12/25", HOJE);
    expect(r2.ok).toBe(false);
  });
  it("aceita cartão que vence neste mês (vale até o último dia)", () => {
    expect(validarValidade("11/26", HOJE).ok).toBe(true);
  });
  it("aceita cartão futuro", () => {
    expect(validarValidade("01/29", HOJE).ok).toBe(true);
  });
  it("rejeita validade absurdamente distante", () => {
    expect(validarValidade("01/60", HOJE).ok).toBe(false);
  });
});

describe("mensagem de estorno", () => {
  it("informa valor, pedido, cartão e prazo", () => {
    expect(mensagemEstorno({ valor: 12.5, ultimos4: "4242", codigoPedido: "CNT-0001" })).toBe(
      "Estorno de R$ 12,50 do pedido CNT-0001 solicitado ao cartão final 4242. O valor aparece na fatura em até 5 dias úteis.",
    );
  });
  it("funciona sem código de pedido (pagamento que falhou antes de criar o pedido)", () => {
    expect(mensagemEstorno({ valor: 6, ultimos4: "4242" })).toBe(
      "Estorno de R$ 6,00 solicitado ao cartão final 4242. O valor aparece na fatura em até 5 dias úteis.",
    );
  });
  it("usa singular para 1 dia útil", () => {
    expect(
      mensagemEstorno({ valor: 3, ultimos4: "1111", codigoPedido: "CNT-0002", prazoDiasUteis: 1 }),
    ).toContain("em até 1 dia útil.");
  });
});