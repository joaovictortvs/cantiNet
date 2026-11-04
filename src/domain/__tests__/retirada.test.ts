import { describe, it, expect } from "vitest";
import {
  ConfirmacaoPorCodigo,
  ConfirmacaoPorQrCode,
  type ConfirmacaoDeRetirada,
  type PedidoRetirada,
  type RepositorioRetirada,
} from "../retirada";

function repo(pedidos: PedidoRetirada[]) {
  const entregues: string[] = [];
  const r: RepositorioRetirada = {
    buscarPorCodigo: (c) => pedidos.find((p) => p.codigo === c),
    marcarEntregue: (id) => {
      entregues.push(id);
      const p = pedidos.find((x) => x.id === id)!;
      p.status = "ENTREGUE";
    },
  };
  return { r, entregues };
}

const implementacoes: [string, (r: RepositorioRetirada) => ConfirmacaoDeRetirada, string][] = [
  ["por código", (r) => new ConfirmacaoPorCodigo(r), "cnt-ab12"],
  ["por QR Code", (r) => new ConfirmacaoPorQrCode(r), "https://cantinet.app/retirada?c=CNT-AB12"],
];

describe.each(implementacoes)("retirada %s (mesmo contrato)", (_nome, criar, entradaValida) => {
  it("entrega um pedido PRONTO", () => {
    const { r, entregues } = repo([{ id: "1", codigo: "CNT-AB12", status: "PRONTO" }]);
    const res = criar(r).confirmar(entradaValida);
    expect(res.ok).toBe(true);
    expect(entregues).toEqual(["1"]);
  });
  it("não entrega pedido que não está pronto", () => {
    const { r, entregues } = repo([{ id: "1", codigo: "CNT-AB12", status: "EM_PREPARO" }]);
    const res = criar(r).confirmar(entradaValida);
    expect(res.ok).toBe(false);
    expect(entregues).toHaveLength(0);
  });
  it("não entrega duas vezes", () => {
    const { r } = repo([{ id: "1", codigo: "CNT-AB12", status: "PRONTO" }]);
    const c = criar(r);
    c.confirmar(entradaValida);
    const segunda = c.confirmar(entradaValida);
    expect(segunda.ok).toBe(false);
    if (!segunda.ok) expect(segunda.motivo).toBe("JA_ENTREGUE");
  });
  it("informa pedido inexistente", () => {
    const { r } = repo([]);
    const res = criar(r).confirmar(entradaValida);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.motivo).toBe("NAO_ENCONTRADO");
  });
  it("rejeita entrada sem código de pedido", () => {
    const { r } = repo([]);
    const res = criar(r).confirmar("lixo");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.motivo).toBe("FORMATO_INVALIDO");
  });
});
