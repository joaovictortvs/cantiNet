import { useState } from 'react';
import type { FormEvent } from 'react';
import { detectarBandeira } from '../../domain/pagamento';
import { acoes } from '../../store/store';

function formatarNumero(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

function formatarValidade(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function CartaoForm({ onSalvo }: { onSalvo: () => void }) {
  const [titular, setTitular] = useState('');
  const [numero, setNumero] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');
  const [tipo, setTipo] = useState<'CREDITO' | 'DEBITO'>('CREDITO');
  const [erro, setErro] = useState<string | null>(null);

  function preencherTeste() {
    setTitular('João Victor Tavares');
    setNumero('4242 4242 4242 4242');
    setValidade('12/30');
    setCvv('123');
  }

  function enviar(ev: FormEvent) {
    ev.preventDefault();
    const r = acoes.cadastrarCartao({ titular, numero, validade, cvv, tipo });
    if (!r.ok) setErro(r.erro ?? 'Dados inválidos.');
    else onSalvo();
  }

  return (
    <form className="form-cartao" onSubmit={enviar}>
      <div className="form-cartao-topo">
        <strong>💳 Cadastrar cartão</strong>
        <button type="button" className="link" onClick={preencherTeste}>
          Usar cartão de teste
        </button>
      </div>
      <label>
        Nome no cartão
        <input value={titular} onChange={(e) => setTitular(e.target.value)} autoComplete="cc-name" />
      </label>
      <label>
        Número {numero && <small className="bandeira">{detectarBandeira(numero)}</small>}
        <input
          inputMode="numeric"
          value={numero}
          onChange={(e) => setNumero(formatarNumero(e.target.value))}
          placeholder="0000 0000 0000 0000"
          autoComplete="cc-number"
        />
      </label>
      <div className="linha-2">
        <label>
          Validade
          <input
            inputMode="numeric"
            value={validade}
            onChange={(e) => setValidade(formatarValidade(e.target.value))}
            placeholder="MM/AA"
          />
        </label>
        <label>
          CVV
          <input
            inputMode="numeric"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            type="password"
          />
        </label>
      </div>
      <div className="segmento">
        <button type="button" className={tipo === 'CREDITO' ? 'ativa' : ''} onClick={() => setTipo('CREDITO')}>
          Crédito
        </button>
        <button type="button" className={tipo === 'DEBITO' ? 'ativa' : ''} onClick={() => setTipo('DEBITO')}>
          Débito
        </button>
      </div>
      {erro && <p className="erro">{erro}</p>}
      <button className="btn btn-primario" type="submit">
        Salvar cartão
      </button>
      <p className="nota">Protótipo: nada é enviado a lugar nenhum. Guardamos só a bandeira e os 4 últimos dígitos.</p>
    </form>
  );
}
