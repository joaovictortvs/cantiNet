import { describe, it, expect } from 'vitest';
import { detectarBandeira, tokenizarCartao, validarCartao, type DadosCartao } from '../pagamento';

const HOJE = new Date(2026, 10, 3); // 03/11/2026

const base: DadosCartao = {
  titular: 'Maria Silva',
  numero: '4242 4242 4242 4242',
  validade: '12/28',
  cvv: '123',
  tipo: 'CREDITO',
};

describe('validarCartao', () => {
  it('aceita um cartão válido', () => {
    expect(validarCartao(base, HOJE)).toBeNull();
  });
  it('recusa cartão vencido (bug da Entrega 1)', () => {
    expect(validarCartao({ ...base, validade: '10/26' }, HOJE)).toBe(
      'Cartão vencido. Cadastre um cartão dentro da validade.',
    );
    expect(validarCartao({ ...base, validade: '01/20' }, HOJE)).toContain('vencido');
  });
  it('aceita cartão que vence no mês atual', () => {
    expect(validarCartao({ ...base, validade: '11/26' }, HOJE)).toBeNull();
  });
  it('mantém as validações antigas', () => {
    expect(validarCartao({ ...base, titular: 'Al' }, HOJE)).toBe('Informe o nome impresso no cartão.');
    expect(validarCartao({ ...base, numero: '1234' }, HOJE)).toBe('Número de cartão inválido.');
    expect(validarCartao({ ...base, validade: '1228' }, HOJE)).toBe('Validade deve ser MM/AA.');
    expect(validarCartao({ ...base, validade: '13/28' }, HOJE)).toBe('Validade deve ser MM/AA.');
    expect(validarCartao({ ...base, cvv: '12' }, HOJE)).toBe('CVV inválido.');
  });
});

describe('detectarBandeira e tokenizarCartao', () => {
  it('detecta bandeiras', () => {
    expect(detectarBandeira('4242424242424242')).toBe('Visa');
    expect(detectarBandeira('5555555555554444')).toBe('Mastercard');
    expect(detectarBandeira('378282246310005')).toBe('Amex');
    expect(detectarBandeira('6363680000000000')).toBe('Elo');
    expect(detectarBandeira('9999999999999999')).toBe('Cartão');
  });
  it('guarda só os 4 últimos dígitos e nunca o número ou o CVV', () => {
    const t = tokenizarCartao(base);
    expect(t.ultimos4).toBe('4242');
    expect(JSON.stringify(t).includes('4242 4242')).toBe(false);
    expect(JSON.stringify(t).includes('123')).toBe(false);
    expect(t.titular).toBe('MARIA SILVA');
  });
});
