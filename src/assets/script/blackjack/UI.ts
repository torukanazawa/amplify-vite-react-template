// UI.ts
import { Game } from "./Game";
import { Player } from "./Player";
import { Card, PlayerAction } from "./types";
import { Message } from "./Message";
export class UI {
  private game: Game;
  private dealerHandElement: HTMLElement;
  private playersAreaElement: HTMLElement;
  private hitBtn: HTMLButtonElement;
  private standBtn: HTMLButtonElement;
  private doubleBtn: HTMLButtonElement;
  private splitBtn: HTMLButtonElement;
  private betAmountInput: HTMLInputElement;
  private placeBetBtn: HTMLButtonElement;
  private nextRoundBtn: HTMLButtonElement;
  private dialog: HTMLDialogElement;
  private dialogMessage: HTMLElement;
  private message: Message;

  constructor(game: Game) {
    this.game = game;
    this.message = new Message();
    this.dealerHandElement = document.getElementById("dealer-hand") as HTMLElement;
    this.playersAreaElement = document.getElementById("players-area") as HTMLElement;
    this.hitBtn = document.getElementById("hit-btn") as HTMLButtonElement;
    this.standBtn = document.getElementById("stand-btn") as HTMLButtonElement;
    this.doubleBtn = document.getElementById("double-btn") as HTMLButtonElement;
    this.splitBtn = document.getElementById("split-btn") as HTMLButtonElement;
    this.betAmountInput = document.getElementById("bet-amount") as HTMLInputElement;
    this.placeBetBtn = document.getElementById("place-bet-btn") as HTMLButtonElement;
    this.nextRoundBtn = document.getElementById("next-round-btn") as HTMLButtonElement;
    this.dialog = document.getElementById("modalDialog") as HTMLDialogElement;
    this.dialogMessage = document.getElementById("dialog-message") as HTMLElement;
  }

  public updateTable(): void {
    this.updateDealerHand();
    this.updatePlayersHands();
    this.updateControls();
  }

  private updateDealerHand(): void {
    this.dealerHandElement.innerHTML = "";
    this.game.dealer.hand.forEach((card, index) => {
      const cardElement = this.createCardElement(card, index === 0 && this.game.gameState !== "dealer_turn" && this.game.gameState !== "resolving");
      this.dealerHandElement.appendChild(cardElement);
    });
  }

  private updatePlayersHands(): void {
    this.playersAreaElement.innerHTML = "";
    this.game.players.forEach((player, index) => {
      const playerElement = document.createElement("div");
      playerElement.classList.add("player");
      // this.game.set_bet(player.bet)
      
      playerElement.innerHTML = `
        <div class="hand"></div>
      `;
      const handElement = playerElement.querySelector(".hand") as HTMLElement;
      player.hands.forEach((hand) => {
        hand.forEach((card) => {
          const cardElement = this.createCardElement(card);
          handElement.appendChild(cardElement);
        });
      });
      this.playersAreaElement.appendChild(playerElement);
    });
  }

  private createCardElement(card: Card, faceDown: boolean = false): HTMLElement {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    if (faceDown) {
      cardElement.textContent = "?";
    } else {
      cardElement.textContent = `${card.value}${card.suit}`;
    }

    const suits = {'♠':'Spade', '♥':'Heart', '♦':'Diamond', '♣':'Club'}
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    if (faceDown) {
      cardElement.innerHTML=`<img src="/card/back.png" />`
    }else{
      cardElement.innerHTML=`<img src="/card/${suits[card.suit]}/${values.findIndex(str=>str==card.value)+1}.png" />`
    }
    
    return cardElement;
  }

  private updateControls(): void {
    const currentPlayer = this.game.players[this.game.currentPlayerIndex];
    this.hitBtn.disabled = !this.game.canPlayerHit(currentPlayer);
    this.standBtn.disabled = !this.game.canPlayerStand(currentPlayer);
    this.doubleBtn.disabled = !this.game.canPlayerDouble(currentPlayer);
    this.splitBtn.disabled = !this.game.canPlayerSplit(currentPlayer);
    // this.placeBetBtn.disabled = this.game.gameState !== "betting";

    // console.log("updateControls", currentPlayer, this.game.currentPlayerIndex, this.hitBtn.disabled);
  }

  public addMessage(str: string, callback:any = null): void {
    this.message.addMessage({ str, callback });
  }

  public clearMessage(): void {
    this.message.clearMessage();
  }

  public async askForInsurance(player: Player): Promise<boolean> {
    return new Promise((resolve) => {
      const message = `${player.name}, would you like to take insurance? (Cost: ${player.bet / 2} chips)`;
      this.dialogMessage.textContent = message;
      this.dialog.showModal();
      this.dialog.onclose = () => {
        resolve(this.dialog.returnValue === "OK");
      };
    });
  }

  public async declareBlackJack(): Promise<boolean> {
    return new Promise((resolve) => {
      this.addMessage(`デーラーのブラックジャックです`,()=>{resolve(true)})
    });
  }

  public async confirmNextRound(): Promise<boolean> {
    return new Promise((resolve) => {
      this.nextRoundBtn.disabled=false;
      this.nextRoundBtn.onclick=()=>{
        resolve(true)
        this.game.set_win(0)
        this.nextRoundBtn.disabled=true;
      }
    });
  }

  public showGameOver(): void {
    this.addMessage("Game Over!\nゲームは楽しめましたか？\nまたプレーしましょう");
  }

  public async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public placeBet(amount){
    console.log("amount",amount);
    this.placeBetBtn.disabled=false
    this.betAmountInput.value=amount;
    this.placeBetBtn.click()
  }
  public async getBetFromPlayer(player: Player): Promise<number> {
    return new Promise((resolve) => {
      if(player.isMe){
        this.placeBetBtn.disabled=false
      }
      this.placeBetBtn.onclick=() => {
        const betAmount = parseInt(this.betAmountInput.value);
        if (betAmount > 0 && betAmount <= this.game.balance) {
          this.placeBetBtn.disabled=true
          resolve(betAmount);
        } else {
          this.addMessage("無効なベット額です。再度入力してください。");
        }
      };
    });
  }

  public async getPlayerAction(player: Player): Promise<PlayerAction> {
    return new Promise((resolve) => {
      const actionHandler = (action: PlayerAction) => {
        this.hitBtn.onclick = null;
        this.standBtn.onclick = null;
        this.doubleBtn.onclick = null;
        this.splitBtn.onclick = null;
        resolve(action);
      };

      this.hitBtn.onclick = () => actionHandler("hit");
      this.standBtn.onclick = () => actionHandler("stand");
      this.doubleBtn.onclick = () => actionHandler("double");
      this.splitBtn.onclick = () => actionHandler("split");
    });
  }
}
