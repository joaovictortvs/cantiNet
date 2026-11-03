import { useState } from 'react';
import { paraHHMM } from '../domain/tempo';
import { AlunoView } from './aluno/AlunoView';
import { PainelAtendente } from './atendente/PainelAtendente';
import { useRelogio } from '../store/store';

type Visao = 'aluno' | 'atendente';

export function App() {
  const [visao, setVisao] = useState<Visao>('aluno');
  const agora = useRelogio();

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="marca-logo">🥪</span>
          <div>
            <h1>Cantina do CESAR</h1>
            <p>Pediu, pagou, retirou. Sem fila.</p>
          </div>
        </div>
        <nav className="abas-visao" aria-label="Visão do aplicativo">
          <button className={visao === 'aluno' ? 'ativa' : ''} onClick={() => setVisao('aluno')}>
            🎓 Aluno
          </button>
          <button className={visao === 'atendente' ? 'ativa' : ''} onClick={() => setVisao('atendente')}>
            👩‍🍳 Atendente
          </button>
        </nav>
        <div className="relogio" title="Hora da cantina">
          🕒 {paraHHMM(agora)}
        </div>
      </header>
      <main className="conteudo">{visao === 'aluno' ? <AlunoView /> : <PainelAtendente />}</main>
    </div>
  );
}
