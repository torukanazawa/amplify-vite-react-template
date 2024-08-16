// Deck.ts
import { Card, Suit, Value } from './types';

export class Deck {
  public cards: Card[];

  constructor() {
    this.cards = this.createDeck();
  }

  private createDeck(): Card[] {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const values: Value[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    return suits.flatMap(suit => values.map(value => ({ suit, value })));
  }

  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public drawCard(): Card {
    const card = this.cards.pop();
    if (!card) {
      throw new Error('Deck is empty');
    }
    return card;
  }
}