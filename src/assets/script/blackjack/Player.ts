// Player.ts
import { Card, Hand } from './types';

export class Player {
  public name: string;
  public hands: Hand[];
  public bet: number;
  public insurance: number;
  public isMe:boolean;

  public chips: number;
  public set_balance: any;

  constructor({name, chips, isMe, set_balance}) {
    this.name = name;
    this.hands = [[]];
    this.bet = 0;
    this.insurance = 0;
    this.set_balance = set_balance;
    this.chips=chips;
    this.isMe=isMe;
    // console.log(this.isMe);
    
  }

  public placeBet(amount: number,balance:number): boolean {
    // console.log(amount,balance);
    if (amount <= balance) {
      this.bet = amount;
      this.chips -= amount;
      return true;
    }
    return false;
  }

  public addCard(card: Card, handIndex: number = 0): void {
    this.hands[handIndex].push(card);
  }

  public canSplit(): boolean {
    const cardValue=(value:string)=>{
      return['J', 'Q', 'K'].includes(value)?10:value;
    }
    return this.hands[0].length === 2 && 
           cardValue(this.hands[0][0].value) === cardValue(this.hands[0][1].value) 
  }

  public split(): boolean {
    if (this.canSplit()) {
      this.hands.push([this.hands[0].pop()!]);
      this.chips -= this.bet
      this.isMe&&this.set_balance((n)=>n-this.bet)
      return true;
    }
    return false;
  }

  public canDouble(): boolean {
    return this.hands[0].length === 2;
  }

  public double(): boolean {
    if (this.canDouble()) {
      this.chips -= this.bet
      this.isMe&&this.set_balance((n)=>n-this.bet)
      this.bet *= 2;
      return true;
    }
    return false;
  }

  public takeInsurance(balance:number): boolean {
    const insuranceAmount = this.bet / 2;
    if (balance >= insuranceAmount) {
      this.insurance = insuranceAmount;
      this.chips -= insuranceAmount
      this.isMe&&this.set_balance((n)=>n-insuranceAmount)
      return true;
    }
    return false;
  }

  public getScore(handIndex: number = 0): number {
    let score = 0;
    let aceCount = 0;
    for (const card of this.hands[handIndex]) {
      if (card.value === 'A') {
        aceCount++;
        score += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
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

  public isBusted(handIndex: number = 0): boolean {
    return this.getScore(handIndex) > 21;
  }

  public resetHands(): void {
    this.hands = [[]];
    this.bet = 0;
    this.insurance = 0;
  }
}