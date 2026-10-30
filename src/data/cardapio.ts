import type { Produto } from '../domain/types';

/** Cardapio inicial. Dados em memoria: nada vai para banco nesta entrega. */
export function criarCardapioInicial(): Produto[] {
  return [
    // Pronta-entrega
    { id: 'brigadeiro', nome: 'Brigadeiro', categoria: 'PRONTA_ENTREGA', preco: 4, emoji: '🍫', estoque: 24, tempoPreparoMin: 0 },
    { id: 'bolo', nome: 'Fatia de bolo', categoria: 'PRONTA_ENTREGA', preco: 7, emoji: '🍰', estoque: 10, tempoPreparoMin: 0 },
    { id: 'torta', nome: 'Torta de limão', categoria: 'PRONTA_ENTREGA', preco: 8, emoji: '🥧', estoque: 8, tempoPreparoMin: 0 },
    { id: 'mousse', nome: 'Mousse de maracujá', categoria: 'PRONTA_ENTREGA', preco: 6, emoji: '🍮', estoque: 12, tempoPreparoMin: 0 },
    { id: 'torrada', nome: 'Torrada', categoria: 'PRONTA_ENTREGA', preco: 6, emoji: '🍞', estoque: 14, tempoPreparoMin: 0 },
    { id: 'agua', nome: 'Água mineral', categoria: 'PRONTA_ENTREGA', preco: 3, emoji: '💧', estoque: 40, tempoPreparoMin: 0 },
    { id: 'refri', nome: 'Refrigerante lata', categoria: 'PRONTA_ENTREGA', preco: 6, emoji: '🥤', estoque: 30, tempoPreparoMin: 0 },
    { id: 'suco', nome: 'Suco de caixinha', categoria: 'PRONTA_ENTREGA', preco: 5, emoji: '🧃', estoque: 20, tempoPreparoMin: 0 },
    { id: 'picole', nome: 'Picolé', categoria: 'PRONTA_ENTREGA', preco: 5, emoji: '🍦', estoque: 18, tempoPreparoMin: 0 },
    // Forno (capacidade limitada)
    { id: 'coxinha', nome: 'Coxinha', categoria: 'FORNO', preco: 7, emoji: '🍗', estoque: 16, tempoPreparoMin: 8 },
    { id: 'enroladinho', nome: 'Enroladinho de salsicha', categoria: 'FORNO', preco: 6, emoji: '🌭', estoque: 12, tempoPreparoMin: 8 },
    { id: 'empada', nome: 'Empada de frango', categoria: 'FORNO', preco: 7, emoji: '🥮', estoque: 10, tempoPreparoMin: 6 },
    // Chapa / feito na hora
    { id: 'tapioca-queijo', nome: 'Tapioca de queijo', categoria: 'CHAPA', preco: 10, emoji: '🫓', estoque: 15, tempoPreparoMin: 6 },
    { id: 'tapioca-carne', nome: 'Tapioca de carne de sol', categoria: 'CHAPA', preco: 14, emoji: '🥩', estoque: 10, tempoPreparoMin: 7 },
    { id: 'cuscuz', nome: 'Cuscuz com ovo', categoria: 'CHAPA', preco: 9, emoji: '🍳', estoque: 12, tempoPreparoMin: 5 },
    { id: 'sanduiche', nome: 'Sanduíche na chapa', categoria: 'CHAPA', preco: 12, emoji: '🥪', estoque: 10, tempoPreparoMin: 7 },
  ];
}
