import { useState, useEffect } from "react";

import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

import {NickNames} from "@/assets/script/api/StaticProps"
import type { Schema } from "@/../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
const client = generateClient<Schema>();

export default function App() {
  const navigate = useNavigate();
  const [user, set_user]: any = useState();
  const [player, set_player]: any = useState();
  
  // ユーザー情報と初回のプレーヤー情報セット
  useEffect(() => {
    (async () => {
      const { email } = await fetchUserAttributes();
      const { username, userId } = await getCurrentUser();
      set_user({ email, username, userId });
      // console.log(email, userId, username);
      const { data } = await client.models.Players.get({ id: userId });
      
      if (data) {
        console.log(player);
        set_player(data);
      } else {

        // const res1 = await client.models.Players.delete(
        //   {
        //     id: userId,
        //   }
        // );
        // console.log(res1);
        
        const res = await client.models.Players.create(
          {
            id: userId,
            userId,
            name: NickNames[Math.floor(Math.random()*NickNames.length)],
            email,
            balance: 1000,
          },
          // { authMode: "userPool" }
        );
        console.log(res);

        set_player(res.data);
      }

    })();
  }, []);
  
  // WaitingRoom周り
  const [waitingRoom, set_waitingRoom]: any = useState([]);
  async function removeWaitingRoom() {
    await client.models.WaitingRoom.delete({
      id: player.id,
    });
  }
  
  async function addWaitingRoomAndStartGame(oneOnOne: boolean) {
    const result = await client.models.WaitingRoom.create(
      {
        id: player.id,
        name: player.name,
        oneOnOne:oneOnOne,
      },
      { authMode: "userPool" }
    );
    console.log(result);
    return result;
  }
  async function addWaitingRoom() {
    const { data } = await client.models.WaitingRoom.list();
    set_waitingRoom(data);
    const sub = client.models.WaitingRoom.observeQuery().subscribe(({ items }) => set_waitingRoom([...items]));

    await addWaitingRoomAndStartGame(false)

    setTimeout(() => {
      client.models.WaitingRoom.update(
        {
          id: player.id,
        },
        { authMode: "userPool" }
      );
    }, 3000);
    
  }
  useEffect(() => {
    console.log({waitingRoom});
  }, [waitingRoom]);


  // GameStart周り
  const [games, set_games]: any = useState([]);
  async function listGames() {
    const { data } = await client.models.Games.list();
    set_games(data);
  }
  useEffect(() => {
    const sub = client.models.Games.observeQuery().subscribe(({ items }) => {
      if(items){
        listGames()
      }
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    // console.log({games});
    if(player&&games.length){
      const joindGame = games.find(({gamePlayers})=>gamePlayers.includes(player.id));
      console.log(joindGame);
      if(joindGame)navigate(`/blackjack/?gameId=${joindGame.id}`);
      // if(joindGame)location.href=`/blackjack/?gameId=${joindGame.id}`;
    }
  }, [games,player]);

  
  return (
    <main className="flex w-screen h-screen">
      <div className="mainArea">
        {waitingRoom.find(({ id }) => id == player.id) && (
          <div className="m-4 flex">
            <button className="button-blue m-auto" onClick={removeWaitingRoom}>
              Cancel
            </button>
            <div className="m-4 flex justify-center">
              {waitingRoom.map(item => (
                <div key={item.id} className="flex flex-col gap-2 items-center">
                  <div className="relative w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                    <svg className="absolute w-12 h-12 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <h3 className="text-white text-xs max-w-14 truncate">{item.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
        {player && !waitingRoom.find(({ id }) => id == player.id) && (
          <div className="m-4 flex">
            <button className="button-blue m-auto" onClick={()=>{addWaitingRoomAndStartGame(true)}}>
              スタート
            </button>
            <button className="button-blue m-auto" onClick={addWaitingRoom}>
              ほかのプレーヤーを待つ
            </button>
            <form
              onSubmit={async (e: any) => {
                e.preventDefault();
                const res = await client.models.Players.update(
                  {
                    id: player.id,
                    name: e.target.name.value,
                    balance: ~~e.target.balance.value,
                  },
                  { authMode: "userPool" }
                );
                console.log(res);
              }}
              className="flex gap-4 items-end"
            >
              <div className="flex gap-4 flex-col">
                <label className="flex gap-4 items-center">
                  <span className="w-12 text-white">Name</span>
                  <input className="p-2" type="text" name="name" defaultValue={player.name} />
                </label>
                <label className="flex gap-4 items-center">
                  <span className="w-12 text-white">所持金</span>
                  <input className="p-2" type="number" name="balance" defaultValue={player.balance||1000} />
                </label>
              </div>

              <button className="button-blue">決定</button>
            </form>
          </div>
        )}
      </div>
      <div className="sideArea">
        <div className="m-4">
          {/* <button onClick={addGamePlayers}>aa</button> */}
        </div>
      </div>
    </main>
  );
}
