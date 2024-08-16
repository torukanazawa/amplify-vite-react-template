// types.ts
export type Suit = '♠' | '♥' | '♦' | '♣';
export type Value = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  value: Value;
}

export type Hand = Card[];

export type PlayerAction = 'hit' | 'stand' | 'double' | 'split';

export type GameState = 'betting' | 'player_turns' | 'dealer_turn' | 'resolving';