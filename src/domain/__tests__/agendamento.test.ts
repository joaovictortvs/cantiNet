import { describe, it } from "vitest";

/**
 * Casos a cobrir em domain/agendamento.ts (preencher com as funções reais do arquivo).
 * Escreva-os ANTES de refatorar: eles protegem a mudança.
 */
describe("agendamento de retirada", () => {
  it.todo("gera slots de 5 em 5 minutos dentro do intervalo");
  it.todo("não oferece horário que já passou");
  it.todo("respeita o limite de vagas da chapa por horário");
  it.todo("só exige horário quando o pedido tem item de chapa");
  it.todo("libera a vaga quando o pedido é cancelado");
  it.todo("pedido só de pronta-entrega ou forno não consome vaga da chapa");
});
