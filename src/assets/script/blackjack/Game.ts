// Game.ts
import { Deck } from "./Deck";
import { Player } from "./Player";
import { Dealer } from "./Dealer";
import { UI } from "./UI";
import { GameState, PlayerAction } from "./types";


export class Game {
  public deck: Deck;
  public players: Player[];
  public dealer: Dealer;
  private ui: UI;
  public currentPlayerIndex: number;
  public gameState: GameState;

  public currentPlayer:Player|null;
  public userId: any;
  public ws: WebSocket;
  public set_win: any;
  public set_bet: any;
  public balance: any;
  public set_balance: any;

  constructor({userId,ws,players,set_win,set_bet,balance,set_balance}) {
    this.userId=userId;
    this.ws=ws;
    this.deck = new Deck();
    this.players = players.map(({playerName,balance,userId}) => {
      return new Player({name:playerName,chips:balance,isMe:this.userId==userId,set_balance})
    });
    this.dealer = new Dealer();
    this.ui = new UI(this);
    this.currentPlayerIndex = 0;
    this.gameState = "betting";

    this.set_win=set_win;
    this.set_bet=set_bet;
    this.balance=balance;
    this.set_balance=set_balance;
    this.currentPlayer=null;
  }
  public async onMessage(message){
    console.log(message,message.action);
    if(message.action == "bet"){
      if(this.userId != message.userId){
        this.ui.placeBet(~~message.value);
      }
    }
  }

  public async start(): Promise<void> {
    while (true) {
      await this.initializeRound();
      await this.playRound();
      await this.endRound();
      if (!(await this.ui.confirmNextRound())) {
        break;
      }
    }
    this.ui.showGameOver();
  }

  private async initializeRound(): Promise<void> {
    this.gameState = "betting";
    this.deck.shuffle();
    this.ui.clearMessage();
    this.ui.updateTable();
    await this.placeBets();
    await this.dealInitialCards();
    this.ui.updateTable();
  }

  private async playRound(): Promise<void> {
    if (this.dealer.canOfferInsurance()) {
      await this.offerInsurance();
      if(this.dealer.getScore()==21){
        await this.ui.declareBlackJack()
        return
      }else{
        await new Promise((resolve) => {
          this.ui.addMessage(`ディーラーはブラックジャックではありませんでした`,()=>{resolve(true)})
        });
      }
    }
    this.gameState = "player_turns";
    this.ui.updateTable();
    await this.playerTurns();
    this.gameState = "dealer_turn";
    await this.dealerTurn();
  }

  private async placeBets(): Promise<void> {    
    for (const player of this.players) {
      this.currentPlayer = player;
      const betAmount = await this.ui.getBetFromPlayer(player);
      const result = player.placeBet(betAmount,this.balance);
      if(result&&player.isMe){
        this.ws.send(JSON.stringify({userId:this.userId,action:"bet",value:betAmount}));
        this.set_balance((n)=>n-betAmount)
        this.set_bet(betAmount)
      }
    }
  }

  private async dealInitialCards(): Promise<void> {
    return new Promise((resolve) => {
      this.ws.addEventListener("message",(_message:any)=>{
        const message=JSON.parse(_message.data)
        if(message.action=="dealInitialCards"){
          for (let i = 0; i < 2; i++) {
            for (let ii = 0; ii < 2; ii++) {
              const player=this.players[ii]
              const cards=message.players[ii].cards;              
              player.addCard(cards[i]);
            }
            this.dealer.addCard(message.dealer[i]);
          }
          resolve()
        }
      })
      this.ws.send(JSON.stringify({userId:this.userId,action:"dealInitialCards"}));
    })

    // for (let i = 0; i < 2; i++) {
    //   for (const player of this.players) {
    //     player.addCard(this.deck.drawCard());
    //   }
    //   this.dealer.addCard(this.deck.drawCard());
    // }
  }

  private async offerInsurance(): Promise<void> {
    
    for (const player of this.players) {
      if (await this.ui.askForInsurance(player)) {
            
        return new Promise((resolve) => {
          this.ws.addEventListener("message",(_message:any)=>{
            const message=JSON.parse(_message.data)
            if(message.action=="dealInitialCards"){
              for (let i = 0; i < 2; i++) {
                for (let ii = 0; ii < 2; ii++) {
                  const player=this.players[ii]
                  const cards=message.players[ii].cards;              
                  player.addCard(cards[i]);
                }
                this.dealer.addCard(message.dealer[i]);
              }
              resolve()
            }
          })
          this.ws.send(JSON.stringify({userId:this.userId,action:"dealInitialCards"}));
        })

        
        player.takeInsurance(this.balance);
      }
    }
  }

  private async playerTurns(): Promise<void> {
    for (let i = 0; i < this.players.length; i++) {
      this.currentPlayerIndex = i;
      console.log("playerTurns",this.currentPlayerIndex);
      const player = this.players[i];
      await this.handlePlayerTurn(player);
    }
  }

  private async handlePlayerTurn(player: Player): Promise<void> {
    while (!player.isBusted() && this.gameState === "player_turns") {
      this.ui.addMessage(`${player.name}のターンです(${player.getScore()})`)
      const action = await this.ui.getPlayerAction(player);
      this.handlePlayerAction(action);
      if (action === "stand" || action === "double") {
        break;
      }
    }
    await new Promise((resolve) => {
      this.ui.addMessage(`${player.name}は(${player.getScore()})`,()=>{resolve(true)})
    });
  }

  private async dealerTurn(): Promise<void> {
    while (this.dealer.shouldHit()) {
      await new Promise((resolve) => {
        this.ui.addMessage(`ディーラーのターンです(${this.dealer.getScore()})`,()=>{resolve(true)})
      });
      this.dealer.addCard(this.deck.drawCard());
      this.ui.updateTable();
      await this.ui.delay(1000); // ディーラーのターンをアニメーション化
    }
    await new Promise((resolve) => {
      this.ui.addMessage(`ディーラーは(${this.dealer.getScore()})`,()=>{resolve(true)})
    });
  }

  private async endRound(): Promise<void> {
    this.gameState = "resolving";
    this.resolveHands();
    this.ui.updateTable();
    this.resetRound();
  }

  private resolveHands(): void {
    const dealerScore = this.dealer.getScore();
    const dealerBusted = this.dealer.isBusted();
    for (const player of this.players) {
      player.hands.forEach((hand, index) => {
        const playerScore = player.getScore(index);
        let win = 0;
        if (player.isBusted(index)) {
          // プレイヤーがバストした場合
          this.ui.addMessage(`${player.name}がバーストしました`)
        } else if (dealerBusted) {
          // ディーラーがバストした場合
          win=player.bet*2;
          this.ui.addMessage(`ディーラがバーストしました\n${player.name}が勝ちました\n${win}獲得です`)
        } else if(playerScore==21 && player.hands.length==1&&player.hands[0].length==2){
          console.log("プレイヤーの勝ち");
          // プレイヤーの勝ち
          win=player.bet*2.5;
          this.ui.addMessage(`${player.name}のブラックです\n${win}獲得です`)
        } else if (playerScore > dealerScore) {
          console.log("プレイヤーの勝ち");
          // プレイヤーの勝ち
          win=player.bet*2;
          this.ui.addMessage(`${player.name}が勝ちました\n${win}獲得です`)
        } else if (playerScore < dealerScore) {
          // プレイヤーの負け
          this.ui.addMessage(`${player.name}の負けです`)
        }else{
          this.ui.addMessage(`${player.name}は同点です。\nかけ金がもどります`)
          console.log("同点の場合は変化なし");
          win=player.bet;
        }
        
        player.chips += win
        player.isMe&&player.set_balance((n)=>n+win)
        this.set_win(win);
        // 同点の場合は変化なし
      });

      // インシュランスの精算
      if (player.insurance > 0) {
        if (dealerScore === 21 && this.dealer.hand.length === 2) {
          player.chips += player.insurance * 2
          player.isMe&&player.set_balance((n)=>n+player.insurance * 2)
        } else {
          player.chips -= player.insurance
          player.isMe&&player.set_balance((n)=>n-player.insurance)
        }
      }
    }
  }

  private resetRound(): void {
    console.log("resetRound");
    for (const player of this.players) {
      player.resetHands();
    }
    this.dealer.resetHand();
    this.currentPlayerIndex = 0;
    this.gameState = "betting";
  }

  // public placeBet(amount: number): void {
  //   const currentPlayer = this.players[this.currentPlayerIndex];
  //   if (currentPlayer.placeBet(amount,this.balance)) {
  //     this.currentPlayerIndex++;
      
  //     if (this.currentPlayerIndex >= this.players.length) {
  //       this.currentPlayerIndex=0;
  //       this.gameState = "player_turns";
  //     }
  //     this.ui.updateTable();
  //   } else {
  //     this.ui.addMessage("Invalid bet amount. Please try again.");
  //   }
  // }

  public canPlayerHit(player: Player): boolean {
    console.log("canPlayerHit",player,this.gameState);
    return this.gameState === "player_turns" && player.getScore() < 21;
  }

  public canPlayerStand(player: Player): boolean {
    return this.gameState === "player_turns";
  }

  public canPlayerDouble(player: Player): boolean {
    return this.gameState === "player_turns" && player.canDouble()&&this.balance >= player.bet;
  }

  public canPlayerSplit(player: Player): boolean {
    return this.gameState === "player_turns" && player.canSplit()&&this.balance >= player.bet;
  }

  public handlePlayerAction(action: PlayerAction): void {
    const currentPlayer = this.players[this.currentPlayerIndex];
    console.log("handlePlayerAction",currentPlayer);
    
    switch (action) {
      case "hit":
        if (this.canPlayerHit(currentPlayer)) {
          currentPlayer.addCard(this.deck.drawCard());
        }
        break;
      case "stand":
        if (this.canPlayerStand(currentPlayer)) {
          if(this.players.length<this.currentPlayerIndex)this.currentPlayerIndex++;
        }
        break;
      case "double":
        if (this.canPlayerDouble(currentPlayer)) {
          currentPlayer.double();
          currentPlayer.addCard(this.deck.drawCard());
          if(this.players.length<this.currentPlayerIndex)this.currentPlayerIndex++;
        }
        break;
      case "split":
        if (this.canPlayerSplit(currentPlayer)) {
          currentPlayer.split();
          currentPlayer.hands.forEach((hand) => hand.push(this.deck.drawCard()));
        }
        break;
    }
    this.ui.updateTable();
  }
}
