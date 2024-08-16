import { useState, useEffect, useRef } from "react";

import Blackjack from "@/components/Blackjack";
import { useLocation } from "react-router-dom";
import { useAtom } from "jotai";

import { userAtom, playerAtom, gamePlayersAtom, gameAtom } from "@/assets/script/blackjack/state";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import type { Schema } from "@/../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
const client = generateClient<Schema>();
import { deleteGames } from "@/assets/script/api/appSync";

export default function Page() {
  const [gamePlayers, set_gamePlayers] = useAtom(gamePlayersAtom);
  const [player, set_player] = useAtom(playerAtom);
  const [game, set_game] = useAtom(gameAtom);
  const [user, set_user]: any = useAtom(userAtom);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const gameId = searchParams.get("gameId");

  /* Players
   ***************/
  async function getPlayers() {
    const { data } = await client.models.Players.get({ id: user.userId });
    if (data) {
      set_player(data);
    }
  }

  /* Games
   ***************/
  async function getGames() {
    const { data } = await client.models.Games.get({ id: gameId });
    set_game(data);
    if (data && (data.status == "bet" || data.status == "insurance" || data.status == "play" || data.status == "result")) {
      listGamePlayers();
    }
  }

  /* GamePlayers
   ***************/
  async function listGamePlayers() {
    // const { data } = await client.models.GamePlayers.list({
    //   filter: {
    //     gameId: {
    //       eq: gameId,
    //     },
    //   },
    // });

    const { data } = await client.models.GamePlayers.listGamePlayersByGameId({
      gameId: gameId,
    });

    console.log(data);
    
    set_gamePlayers(data);
  }

  // ユーザー情報と初回のプレーヤー情報セット
  useEffect(() => {
    (async () => {
      const { email } = await fetchUserAttributes();
      const { username, userId } = await getCurrentUser();
      set_user({ email, username, userId });
    })();
  }, []);
  useEffect(() => {
    if (user) {
      const GamesSub = client.models.Games.observeQuery({
        filter: {
          id: {
            eq: gameId,
          },
        },
      }).subscribe(({ items }) => {
        if (items) {
          getGames();
        }
      });
      const GamePlayersSub = client.models.GamePlayers.observeQuery({
        filter: {
          gameId: {
            eq: gameId,
          },
        },
      }).subscribe(({ items }) => {
        // console.log("GamePlayersSub", items);
        if (items) {
          listGamePlayers();
        }
      });
      const PlayersSub = client.models.Players.observeQuery({
        filter: {
          id: {
            eq: user.userId,
          },
        },
      }).subscribe(({ items }) => {
        if (items) {
          getPlayers();
        }
      });
      return () => {
        GamePlayersSub.unsubscribe();
        GamesSub.unsubscribe();
        PlayersSub.unsubscribe();
      };
    }
  }, [user]);
  // useEffect(() => {
  //   if(game&&gamePlayers&&player){
  //     if(game.status==)
  //   }
  // }, [game,gamePlayers,player]);

  return (
    <>
      {gameId && game && player && gamePlayers && <Blackjack {...{ gameId, game, player, gamePlayers }} />}

      {game && gamePlayers && gamePlayers.length == 0 && (
        <div>
          <button
            onClick={() => {
              deleteGames({ id: game.id });
            }}
          >
            ゲーム削除
          </button>
        </div>
      )}
    </>
  );
}
