import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Testes de arquitetura: garantem as regras de dependência (DIP) e que a refatoração não "desfaz".
 * domain ← app ← ui, e infra só depende do domain. Só composicao.ts e main.tsx conhecem tudo.
 */
const RAIZ = join(process.cwd(), 'src');

function arquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : arquivos(caminho);
    return /\.(ts|tsx)$/.test(e.name) ? [caminho] : [];
  });
}

function importsDe(arquivo: string): string[] {
  const texto = readFileSync(arquivo, 'utf8');
  return [...texto.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

/** Camada de destino de um import relativo ('' para pacotes externos). */
function camadaDoImport(arquivo: string, alvo: string): string {
  if (!alvo.startsWith('.')) return '';
  const resolvido = relative(RAIZ, join(arquivo, '..', alvo));
  return resolvido.split('/')[0];
}

function violacoes(camada: string, proibidas: string[], externosProibidos: RegExp[] = []): string[] {
  const achadas: string[] = [];
  for (const arq of arquivos(join(RAIZ, camada))) {
    for (const imp of importsDe(arq)) {
      const destino = camadaDoImport(arq, imp);
      if (proibidas.includes(destino) || externosProibidos.some((re) => re.test(imp))) {
        achadas.push(`${relative(RAIZ, arq)} importa ${imp}`);
      }
    }
  }
  return achadas;
}

describe('arquitetura em camadas', () => {
  it('domain não depende de app, ui, infra nem de React', () => {
    expect(violacoes('domain', ['app', 'ui', 'infra'], [/^react/, /^qrcode/, /^jsqr/])).toEqual([]);
  });

  it('app (aplicação) não depende de ui nem de infra: só de interfaces do domain', () => {
    expect(violacoes('app', ['ui', 'infra'], [/^react/])).toEqual([]);
  });

  it('infra só implementa portas do domain: não conhece app nem ui', () => {
    expect(violacoes('infra', ['app', 'ui'])).toEqual([]);
  });

  it('ui só conhece app e compartilhado: nunca domain nem infra (Demeter)', () => {
    expect(violacoes('ui', ['domain', 'infra'])).toEqual([]);
  });

  it('só a composição liga as classes concretas de infra', () => {
    const quemImportaInfra: string[] = [];
    for (const camada of ['domain', 'app', 'ui']) {
      for (const arq of arquivos(join(RAIZ, camada))) {
        if (importsDe(arq).some((i) => camadaDoImport(arq, i) === 'infra')) quemImportaInfra.push(relative(RAIZ, arq));
      }
    }
    expect(quemImportaInfra).toEqual([]);
  });
});

describe('Aberto/Fechado e encapsulamento', () => {
  it('a IA e a cozinha não citam nenhuma estação concreta', () => {
    for (const arq of ['domain/ia.ts', 'domain/cozinha/Cozinha.ts']) {
      const texto = readFileSync(join(RAIZ, arq), 'utf8');
      expect(texto).not.toMatch(/\b(Forno|Chapa|Balcao|Liquidificador)\b/);
      expect(importsDe(join(RAIZ, arq)).some((i) => i.includes('estacoes'))).toBe(false);
    }
  });

  it('entidades usam campos #privados (sem parameter properties públicas)', () => {
    for (const arq of ['Produto', 'Pedido', 'Carrinho']) {
      const texto = readFileSync(join(RAIZ, `domain/modelos/${arq}.ts`), 'utf8');
      expect(texto).toMatch(/#\w+/);
    }
  });

  it('não sobrou a store global nem a função de pagamento dentro do domínio', () => {
    const domain = arquivos(join(RAIZ, 'domain')).map((a) => readFileSync(a, 'utf8')).join('\n');
    expect(domain).not.toMatch(/setTimeout/);
    expect(arquivos(RAIZ).some((a) => a.includes('/store/'))).toBe(false);
  });
});
