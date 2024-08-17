
import { useState, useEffect, useRef } from "react";
import { canSplit, getScore } from "@/assets/script/blackjack/GameUtils";
import { Message } from "@/assets/script/blackjack/Message";
import { updateGames, updateGamePlayers, createGamePlayers, updatePlayers, deleteGamePlayers } from "@/assets/script/api/appSync";
import BetUi from "@/components/BetUi";
import type { Schema } from "@/../amplify/data/resource";

export default function Blackjack({ gameId,gamePlayers, player, game }) {
  const messageRef = useRef<Message>();
  const [betAmount, set_betAmount] = useState(0);

  const [self, set_self] = useState<Schema["GamePlayers"]["type"]>();
  const [winResult, set_winResult] = useState({ bet: 0, win: 0 });

  useEffect(() => {
    set_self(gamePlayers.find((item) => item.id == player.id));
    const splitPlayer = gamePlayers.find((item) => item.split == player.id);
    if (splitPlayer && game.currentTurn == splitPlayer.id) {
      set_self(splitPlayer);
    }

    if (gamePlayers.some((item) => item.status == "result")) {
      const result = gamePlayers
        .filter((item) => item.id == player.id || item.split == player.id)
        .reduce(
          (acc, value) => {
            acc.bet += value.bet;
            acc.win += value.win;
            return acc;
          },
          { bet: 0, win: 0 }
        );
      set_winResult(result);
    }
  }, [gamePlayers]);

  useEffect(() => {
    console.log(game);
  }, [game]);

  const [showMessage, set_showMessage] = useState<string | null>(null);
  useEffect(() => {
    if (game && self && game.status == "play" && game.currentTurn == self.id) {
      if (self.cards && !canSplit(self.cards) && getScore(self.cards) >= 20) {
        set_showMessage("a");
        const timeoutId = setTimeout(() => {
          stand();
          set_showMessage(null);
        }, 1000);
        // こういう処理を書く
        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
  }, [game, self]);

  /* card
   ***************/
  function createCardElement(card: Schema["Card"]["type"], faceDown: boolean = false) {
    const suits = { "♠": "Spade", "♥": "Heart", "♦": "Diamond", "♣": "Club" };
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const src = faceDown ? "/card/back.png" : `/card/${suits[card.suit]}/${values.findIndex((str) => str == card.value) + 1}.png`;
    return (
      <div className="card" key={card.suit + card.value}>
        <img src={src} alt="" />
      </div>
    );
  }
  /* turn
   ***************/
  function nextTurn(): string {
    let nextTurn = null;
    for (let i = 0; i < gamePlayers.length; i++) {
      if (gamePlayers[i].id == game.currentTurn) {
        nextTurn = gamePlayers[i + 1] ? gamePlayers[i + 1].id : "dealer";
        break;
      }
    }
    return nextTurn;
  }

  /* bet
   ***************/
  async function bet() {
    if (betAmount <= 0) {
      return true;
    }
    await updateGamePlayers({
      id: player.id,
      bet: betAmount,
      cards: null,
      status: "betted",
    });
    await updatePlayers({
      id: player.id,
      balance: player.balance - betAmount,
    });
  }

  /* insurance
   ***************/
  async function insurance() {
    const insurance = Math.round(self.bet * 0.5);

    await updateGamePlayers({
      id: player.id,
      insurance: insurance,
      status: "insuranced",
    });
    await updatePlayers({
      id: player.id,
      balance: player.balance - insurance,
    });
  }
  async function noInsurance() {
    await updateGamePlayers({
      id: player.id,
      insurance: 0,
      status: "insuranced",
    });
  }

  /* hit
   ***************/
  async function hit() {
    const query = {
      id: self.id,
      cards: self.cards,
    };
    query.cards.push(game.deck.shift());

    await updateGamePlayers(query);
    await updateGames({
      id: gameId,
      deck: game.deck,
    });
  }

  /* stand
   ***************/
  async function stand() {
    const currentTurn: string = nextTurn();
    await updateGames({
      id: gameId,
      currentTurn,
    });
  }

  /* double
   ***************/
  async function double() {
    await updatePlayers({
      id: player.id,
      balance: player.balance - self.bet,
    });

    await updateGamePlayers({
      id: self.id,
      bet: self.bet * 2,
    });

    await hit();
    await stand();
  }

  /* split
   ***************/
  async function split() {
    const splitCard = self.cards.pop();
    self.cards.push(game.deck.shift());
    const splitCards = [splitCard, game.deck.shift()];

    await updateGamePlayers({
      id: player.id,
      status: "play",
      cards: self.cards,
    });

    // createdAtを生成
    const date = new Date(self.createdAt);
    date.setTime(date.getTime() + 1);

    await updatePlayers({
      id: player.id,
      balance: player.balance - self.bet,
    });

    // gamePlayersを生成
    const { data } = await createGamePlayers({
      status: "play",
      name: self.name,
      gameId: gameId,
      cards: splitCards,
      bet: self.bet,
      insurance: 0,
      win: 0,
      split: player.id,
      createdAt: date.toISOString(),
    });
    // console.log(data.id);

    // gamesを更新
    const index = game.gamePlayers.findIndex((id) => id == self.id);
    game.gamePlayers.splice(index + 1, 0, data.id),
      await updateGames({
        id: game.gameId,
        gamePlayers: game.gamePlayers,
        deck: game.deck,
      });
  }

  /* next
   ***************/
  async function next() {
    const splitPlayer = gamePlayers.find((item) => item.split == player.id);
    await updateGamePlayers({
      id: player.id,
      status: "next",
    });
    if (splitPlayer) {
      await updateGames({
        id: gameId,
        gamePlayers: game.gamePlayers.filter((id) => id != splitPlayer.id),
      });
      await deleteGamePlayers({ id: splitPlayer.id });
    }
  }

  return (
    <>
      <div className="GameTable">
        <div className="player-info-holder">
          {player &&
            gamePlayers.map((item) => {
              return (
                <div key={item.id} className="player-info">
                  {item.id == player.id ? (
                    <>
                      <div className="item flex items-center">
                        <p className="text">You</p>
                      </div>
                      <div className="item">
                        <p className="title">Balance</p>
                        <p className="text">{player.balance}</p>
                      </div>
                    </>
                  ) : (
                    <div className="item flex items-center">
                      <p className="title">{item.name}</p>
                    </div>
                  )}
                  <div className="item">
                    <p className="title">Win</p>
                    <p className="text">{item.win}</p>
                  </div>
                  <div className="item">
                    <p className="title">Bet</p>
                    <p className="text">{item.bet}</p>
                  </div>
                  <div className="item">
                    <p className="title">player</p>
                    <button
                      className="text"
                      onClick={() => {
                        deleteGamePlayers({ id: item.id });
                      }}
                    >
                      DEL
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
        {/play|insurance|result/.test(game.status) && (
          <div id="game-container" className="game-container">
            <div id="dealer-area" className="dealer-area">
              {game && game.dealerCards && (
                <div id="dealer-hand" className="hand">
                  {game.dealerCards && game.currentTurn == "dealer" && (
                    <div className="tooltips" key={getScore(game.dealerCards)}>
                      <div className="score">{getScore(game.dealerCards)}</div>
                    </div>
                  )}
                  {game.dealerCards.map((card, i) => createCardElement(card, game.currentTurn != "dealer" && i == 1))}
                </div>
              )}
            </div>
            <div id="players-area" className="players-area">
              {player &&
                gamePlayers.map((item) => (
                  <div className="player" key={item.id}>
                    <div className={`hand ${game.status == "play" && game.currentTurn == player.id && item.id == player.id ? "active" : ""}`}>
                      {item.cards && (
                        <div className="tooltips" key={item.id + getScore(item.cards)}>
                          <div className="score">{getScore(item.cards)}</div>
                        </div>
                      )}
                      {item.cards && item.cards.map((card) => createCardElement(card))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        <dialog id="modalDialog" className="dialog">
          <div className="dialog-container">
            <div id="dialog-message">Message</div>
            <form method="dialog">
              <button type="submit" value="OK">
                Ok
              </button>
              <button type="submit" value="CANCEL">
                Cancel
              </button>
            </form>
          </div>
        </dialog>

        {game.status == "bet" && self && self.status == "bet" && (
          <div className="betUi">
            <BetUi onBet={set_betAmount} />
            <div className="center">
              <button onClick={bet} className="button-circle">
                BET - {betAmount}
              </button>
            </div>
          </div>
        )}

        {game && self && !showMessage && (
          <div className="messag-wrapper">
            {game.status == "insurance" && game.currentTurn == self.id && (
              <div className="insuranceUi">
                <button onClick={insurance} className="next-round-btn actionButton">
                  Insurance
                </button>
                <button onClick={noInsurance} className="next-round-btn actionButton">
                  Continue
                </button>
              </div>
            )}

            {game.status == "play" && game.currentTurn == self.id && (
              <div className="controlsUi">
                <button onClick={split} className="actionButton" disabled={self && self.cards && canSplit(self.cards) ? false : true} type="button">
                  SPLIT
                </button>
                <button onClick={hit} className="actionButton" type="button">
                  HIT
                </button>
                <button onClick={stand} className="actionButton" type="button">
                  STAND
                </button>
                <button onClick={double} className={`actionButton`} disabled={self && self.cards && self.cards.length == 2 ? false : true} type="button">
                  DOUBLE
                </button>
              </div>
            )}

            {game.status == "result" && self && self.status == "result" && (
              <div className={`result-panel ${winResult.win > winResult.bet ? "win" : winResult.win == winResult.bet ? "push" : "lose"}`}>
                <h3 className="title">{winResult.win > winResult.bet ? "WIN" : winResult.win == winResult.bet ? "PUSH" : "LOSE"}</h3>
                {winResult.win > winResult.bet && <p className="text">{winResult.win}</p>}
              </div>
            )}

            {game.status == "result" && self && self.status != "next" && (
              <div className="nextRoundUi">
                <button onClick={next} className="next-round-btn actionButton">
                  Next
                </button>
              </div>
            )}

            <div className="message-area" id="message-area"></div>
          </div>
        )}
      </div>
    </>
  );
}
