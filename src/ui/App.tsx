import { useState } from 'react';
import { paraHHMM } from '../domain/tempo';
import { Logo } from './Logo';
import { AlunoView } from './aluno/AlunoView';
import { PainelAtendente } from './atendente/PainelAtendente';
import { useRelogio } from '../store/store';

type Visao = 'aluno' | 'atendente';

export function App() {
  const [visao, setVisao] = useState<Visao>('aluno');
  const agora = useRelogio();

  return (
    <div className={`app visao-${visao}`}>
      <header className="topo">
        <div className="marca">
          <Logo />
          <div>
            <h1>
              Canti<span>Net</span>
            </h1>
            <p>A cantina do CESAR · pediu, pagou, retirou</p>
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
