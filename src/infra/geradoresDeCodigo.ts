import type { GeradorDeCodigos } from '../domain/portas/codigos';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Códigos CNT-XXXX sem caracteres ambíguos (0/O, 1/I) e sem repetir. */
export class GeradorDeCodigosAleatorios implements GeradorDeCodigos {
  readonly #usados = new Set<string>();

  proximo(): string {
    let codigo: string;
    do {
      let sufixo = '';
      for (let i = 0; i < 4; i++) sufixo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
      codigo = `CNT-${sufixo}`;
    } while (this.#usados.has(codigo));
    this.#usados.add(codigo);
    return codigo;
  }
}

/** CNT-1001, CNT-1002... — previsíveis, para testes. */
export class GeradorDeCodigosSequenciais implements GeradorDeCodigos {
  #n = 1000;

  proximo(): string {
    this.#n += 1;
    return `CNT-${this.#n}`;
  }
}
