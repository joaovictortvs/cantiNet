import { describe, it, expect } from "vitest";
import { Cozinha, type PedidoParaCozinha } from "../cozinha/Cozinha";
import type { Estacao, ProdutoPreparavel } from "../cozinha/Estacao";
import { Balcao, Chapa, criarEstacoesPadrao, Forno } from "../cozinha/estacoes";

const pizza: ProdutoPreparavel = { id: "p1", nome: "Pizza", categoria: "FORNO", tempoPreparoMin: 10 };
const empada: ProdutoPreparavel = { id: "p5", nome: "Empada", categoria: "FORNO", tempoPreparoMin: 6 };
const hamburguer: ProdutoPreparavel = { id: "p2", nome: "Hambúrguer", categoria: "CHAPA", tempoPreparoMin: 5 };
const agua: ProdutoPreparavel = { id: "p3", nome: "Água", categoria: "PRONTA_ENTREGA", tempoPreparoMin: 0 };
const suco: ProdutoPreparavel = { id: "p4", nome: "Suco de laranja", categoria: "SUCO_NATURAL", tempoPreparoMin: 3 };

const ALVO = 12 * 60; // 12:00
const pedido = (codigo: string, itens: PedidoParaCozinha["itens"], alvoMin = ALVO): PedidoParaCozinha => ({
  id: codigo,
  codigo,
  alvoMin,
  itens,
});

describe("Cozinha (a 'IA' de agendamento reverso)", () => {
  const cozinha = new Cozinha(criarEstacoesPadrao());

  it("faz forno e chapa terminarem juntos no horário de retirada", () => {
    const plano = cozinha.planejar(
      [pedido("CNT-0001", [{ produto: pizza, quantidade: 1 }, { produto: hamburguer, quantidade: 1 }])],
      0,
    );
    const forno = plano.blocos.find((b) => b.estacaoId === "forno")!;
    const chapa = plano.blocos.find((b) => b.estacaoId === "chapa")!;
    expect(forno.inicioMin).toBe(ALVO - 10);
    expect(chapa.inicioMin).toBe(ALVO - 5);
    expect(forno.fimMin).toBe(ALVO);
    expect(chapa.fimMin).toBe(ALVO);
    expect(plano.alertas).toHaveLength(0);
  });

  it("junta os itens da mesma estação em uma tarefa com o maior tempo", () => {
    const plano = cozinha.planejar(
      [pedido("CNT-0001", [{ produto: pizza, quantidade: 2 }, { produto: empada, quantidade: 1 }])],
      0,
    );
    expect(plano.blocos).toHaveLength(1);
    expect(plano.blocos[0].descricao).toBe("2× Pizza, 1× Empada");
    expect(plano.blocos[0].inicioMin).toBe(ALVO - 10);
  });

  it("pronta-entrega vira uma tarefa de 1 min no Balcão, sem aquecimento", () => {
    const plano = cozinha.planejar([pedido("CNT-0001", [{ produto: agua, quantidade: 2 }])], 0);
    expect(plano.blocos).toHaveLength(1);
    expect(plano.blocos[0].estacaoId).toBe("balcao");
    expect(plano.blocos[0].descricao).toBe("Separar 2× Água");
    expect(plano.blocos[0].inicioMin).toBe(ALVO - 1);
    expect(plano.blocos[0].aquecidoMin).toBe(0);
  });

  it("com bancada ocupada, a tarefa termina antes e fica aquecida", () => {
    // 3 pedidos com pizza no mesmo horário, só 2 bandejas
    const plano = cozinha.planejar(
      ["CNT-0001", "CNT-0002", "CNT-0003"].map((c) => pedido(c, [{ produto: pizza, quantidade: 1 }])),
      0,
    );
    const fornos = plano.blocos.filter((b) => b.estacaoId === "forno");
    expect(fornos).toHaveLength(3);
    expect(fornos.filter((b) => b.aquecidoMin === 0)).toHaveLength(2);
    const aquecida = fornos.find((b) => b.aquecidoMin > 0)!;
    expect(aquecida.fimMin).toBe(ALVO - 10);
    expect(aquecida.aquecidoMin).toBe(10);
    expect(plano.alertas.some((a) => a.includes("aquecido"))).toBe(true);
  });

  it("usa os nomes de bancada definidos pela estação", () => {
    const plano = cozinha.planejar(
      ["CNT-0001", "CNT-0002"].map((c) => pedido(c, [{ produto: pizza, quantidade: 1 }])),
      0,
    );
    const rotulos = plano.blocos.map((b) => b.rotuloBancada).sort();
    expect(rotulos).toEqual(["Forno · bandeja 1", "Forno · bandeja 2"]);
  });

  it("alerta 'iniciar agora' quando já passou da hora de começar", () => {
    const plano = cozinha.planejar([pedido("CNT-0001", [{ produto: pizza, quantidade: 1 }])], ALVO - 4);
    expect(plano.blocos[0].atrasado).toBe(true);
    expect(plano.alertas.some((a) => a.includes("iniciar agora"))).toBe(true);
  });

  it("é determinística: mesma entrada, mesmo plano", () => {
    const pedidos = [
      pedido("CNT-0002", [{ produto: hamburguer, quantidade: 2 }], ALVO + 5),
      pedido("CNT-0001", [{ produto: pizza, quantidade: 1 }]),
    ];
    expect(cozinha.planejar(pedidos, 0)).toEqual(cozinha.planejar([...pedidos].reverse(), 0));
  });

  it("reorganiza sozinha quando chegam novos pedidos", () => {
    const um = pedido("CNT-0001", [{ produto: pizza, quantidade: 1 }]);
    const dois = pedido("CNT-0002", [{ produto: pizza, quantidade: 1 }]);
    const tres = pedido("CNT-0003", [{ produto: pizza, quantidade: 1 }]);
    const antes = cozinha.planejar([um], 0);
    const depois = cozinha.planejar([um, dois, tres], 0);
    expect(antes.blocos.every((b) => b.aquecidoMin === 0)).toBe(true);
    expect(depois.blocos.some((b) => b.aquecidoMin > 0)).toBe(true);
  });

  it("avisa quando nenhuma estação atende a categoria", () => {
    const semSuco = new Cozinha([new Forno(), new Chapa(), new Balcao()]);
    const plano = semSuco.planejar([pedido("CNT-0001", [{ produto: suco, quantidade: 1 }])], 0);
    expect(plano.alertas.some((a) => a.includes("SUCO_NATURAL"))).toBe(true);
  });
});

describe("Estações plugáveis (OCP)", () => {
  it("o Liquidificador entra só como classe nova + registro", () => {
    const plano = new Cozinha(criarEstacoesPadrao()).planejar(
      [pedido("CNT-0001", [{ produto: suco, quantidade: 1 }])],
      0,
    );
    expect(plano.blocos).toHaveLength(1);
    expect(plano.blocos[0].estacaoId).toBe("liquidificador");
    expect(plano.blocos[0].rotuloBancada).toBe("Liquidificador");
    expect(plano.blocos[0].inicioMin).toBe(ALVO - 3);
  });

  it("uma estação criada no teste funciona sem alterar a Cozinha", () => {
    const sorveteira: Estacao = {
      id: "sorveteira",
      nome: "Sorveteira",
      categoria: "SORVETE",
      bancadas: 1,
      tempoPreparo: () => 2,
    };
    const sorvete: ProdutoPreparavel = { id: "p9", nome: "Sorvete", categoria: "SORVETE", tempoPreparoMin: 0 };
    const plano = new Cozinha([sorveteira]).planejar([pedido("CNT-0001", [{ produto: sorvete, quantidade: 1 }])], 0);
    expect(plano.blocos[0].estacaoNome).toBe("Sorveteira");
  });
});