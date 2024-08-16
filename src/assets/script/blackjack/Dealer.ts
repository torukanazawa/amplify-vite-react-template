// Dealer.ts
import { Card, Hand } from "./types";

export class Dealer {
  public hand: Hand;

  constructor() {
    this.hand = [];
  }

  public addCard(card: Card): void {
    this.hand.push(card);
  }

  public getVisibleCard(): Card | undefined {
    return this.hand[1];
  }

  public getScore(): number {
    let score = 0;
    let aceCount = 0;
    for (const card of this.hand) {
      if (card.value === "A") {
        aceCount++;
        score += 11;
      } else if (["J", "Q", "K"].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    }
    while (score > 21 && aceCount > 0) {
      score -= 10;
      aceCount--;
    }
    
    return score;
  }

  public shouldHit(): boolean {
    return this.getScore() < 17;
  }

  public canOfferInsurance(): boolean {
    return this.getVisibleCard()?.value === "A";
  }

  public isBusted(): boolean {
    return this.getScore() > 21;
  }

  public resetHand(): void {
    this.hand = [];
  }
}
