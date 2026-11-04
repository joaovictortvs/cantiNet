import { describe, it, expect } from "vitest";
import { Cozinha } from "../cozinha/Cozinha";
import { criarEstacoesPadrao } from "../cozinha/estacoes";
import { orquestrarCozinha as orquestrar } from "../ia";
import type { ItemPedido, Pedido } from "../types";

const ALVO = 12 * 60;
const cozinhaPadrao = new Cozinha(criarEstacoesPadrao());
const orquestrarCozinha = (pedidos: Parameters<typeof orquestrar>[0], agora: number) => orquestrar(pedidos, agora, cozinhaPadrao);

const item = (produtoId: string, nome: string, categoria: ItemPedido["categoria"], tempo: number, quantidade = 1): ItemPedido => ({
  produtoId,
  nome,
  categoria,
  emoji: "🍽️",
  quantidade,
  precoUnit: 5,
  tempoPreparoMin: tempo,
});

const pedido = (codigo: string, itens: ItemPedido[], status: Pedido["status"] = "AGUARDANDO"): Pedido => ({
  id: codigo,
  codigo,
  aluno: "Ana",
  itens,
  total: 10,
  retiradaMin: ALVO,
  criadoEmMin: 0,
  status,
  pagoCom: "Visa •••• 4242",
});

const coxinha = item("coxinha", "Coxinha", "FORNO", 8);
const tapioca = item("tapioca", "Tapioca", "CHAPA", 6);
const sucoNatural = item("suco-laranja", "Suco de laranja", "SUCO_NATURAL", 3);
const agua = item("agua", "Água", "PRONTA_ENTREGA", 0);

describe("orquestrarCozinha (usa as estações plugáveis)", () => {
  it("pedido misto: todas as estações terminam no horário de retirada", () => {
    const plano = orquestrarCozinha([pedido("CNT-0001", [coxinha, tapioca, agua])], 0);
    expect(plano.tarefas).toHaveLength(3);
    expect(plano.tarefas.every((t) => t.fimMin === ALVO)).toBe(true);
    expect(plano.tarefas.find((t) => t.estacao === "forno")!.inicioMin).toBe(ALVO - 8);
    expect(plano.tarefas.find((t) => t.estacao === "chapa")!.inicioMin).toBe(ALVO - 6);
  });

  it("o suco natural aparece como tarefa do Liquidificador", () => {
    const plano = orquestrarCozinha([pedido("CNT-0001", [sucoNatural])], 0);
    expect(plano.tarefas).toHaveLength(1);
    expect(plano.tarefas[0].estacao).toBe("liquidificador");
    expect(plano.tarefas[0].bancada).toBe("Liquidificador");
    expect(plano.tarefas[0].inicioMin).toBe(ALVO - 3);
    expect(plano.explicacoes[0]).toContain("liquidificador");
  });

  it("só pronta-entrega: explica que é só separar", () => {
    const plano = orquestrarCozinha([pedido("CNT-0001", [agua])], 0);
    expect(plano.explicacoes[0]).toContain("só pronta-entrega");
    expect(plano.alertas).toHaveLength(0);
  });

  it("ignora pedidos prontos e entregues", () => {
    const plano = orquestrarCozinha(
      [pedido("CNT-0001", [coxinha], "PRONTO"), pedido("CNT-0002", [coxinha], "ENTREGUE")],
      0,
    );
    expect(plano.tarefas).toHaveLength(0);
    expect(plano.resumo).toContain("Sem pedidos");
  });

  it("pedido em preparo fica 'em andamento' e não pede para iniciar agora", () => {
    const plano = orquestrarCozinha([pedido("CNT-0001", [coxinha], "EM_PREPARO")], ALVO - 2);
    expect(plano.tarefas[0].emAndamento).toBe(true);
    expect(plano.tarefas[0].iniciarAgora).toBe(false);
    expect(plano.alertas).toHaveLength(0);
  });

  it("pedido atrasado pede para iniciar agora e gera alerta", () => {
    const plano = orquestrarCozinha([pedido("CNT-0001", [coxinha])], ALVO - 5);
    expect(plano.tarefas[0].iniciarAgora).toBe(true);
    expect(plano.tarefas[0].atrasoMin).toBe(3);
    expect(plano.alertas.some((a) => a.includes("risco de 3 min de atraso"))).toBe(true);
  });

  it("com 3 pedidos no forno e 2 bandejas, um item fica aquecido", () => {
    const plano = orquestrarCozinha(
      ["CNT-0001", "CNT-0002", "CNT-0003"].map((c) => pedido(c, [coxinha])),
      0,
    );
    expect(plano.tarefas.filter((t) => t.aquecidoMin > 0)).toHaveLength(1);
    expect(plano.alertas.some((a) => a.includes("manter aquecido"))).toBe(true);
  });

  it("numera as tarefas por ordem de início", () => {
    const plano = orquestrarCozinha([pedido("CNT-0001", [coxinha, tapioca])], 0);
    expect(plano.tarefas.map((t) => t.ordem)).toEqual([1, 2]);
    expect(plano.tarefas[0].estacao).toBe("forno"); // começa antes (8 min > 6 min)
  });
});
