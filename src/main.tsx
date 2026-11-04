import React from 'react';
import ReactDOM from 'react-dom/client';
import { montarCantina } from './composicao';
import { App } from './ui/App';
import { ProvedorDaCantina } from './ui/contexto';
import './ui/styles.css';

// A composição liga as peças concretas; a interface só recebe a cantina pronta.
const cantina = montarCantina();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProvedorDaCantina cantina={cantina}>
      <App />
    </ProvedorDaCantina>
  </React.StrictMode>,
);
