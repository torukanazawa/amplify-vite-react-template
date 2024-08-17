export default function App() {
  return <></>
}
// import { useState, useEffect } from "react";

// // auth系
// import { Amplify } from "aws-amplify";
// import { withAuthenticator } from "@aws-amplify/ui-react";
// import "@aws-amplify/ui-react/styles.css";
// import awsconfig from "@/aws-exports";
// Amplify.configure(awsconfig);
// import { fetchData , saveData ,updateData, deleteData, subscribeData } from "@/assets/script/api/Player";
// import { currentAuthenticatedUser } from "@/assets/script/user/profile";

// function Page({ user = null }) {
//   const [userProfile, set_userProfile]: any = useState();
//   const [playerProfile, set_playerProfile]: any = useState();

//   useEffect(() => {
//     (async()=>{
//       const userProfile = await currentAuthenticatedUser();
//       set_userProfile(userProfile)
//       const values = await fetchData(user.userId);
//       if(values){
//         set_playerProfile(values);
//       }
//     })()
//   }, []);

//   return (
//     <main>
//       <form
//         onSubmit={async (e: any) => {
//           e.preventDefault();
//           const input ={
//             id:user.userId,
//             userId:user.userId,
//             username:e.target.name.value,
//             email:userProfile.email,
//             balance:~~e.target.balance.value
//           }
//           if(playerProfile){
//             updateData(input)
//           }else{
//             saveData(input)
//           }
//         }}
//       >
//         <div className="flex flex-col bg-white p-8 relative">
//           <button className="absolute top-0 right-0" onClick={async()=>{
//             const res = deleteData({id:user.userId});
//             console.log(res);
            
//           }} type="button">削除</button>
//           <label className="flex mb-4 items-center gap-5">
//             <span className="">Name</span>
//             <span>
//               <input className="border border-slate-300 border-solid py-2 px-3" type="text" name="name" defaultValue={playerProfile?.username} />
//             </span>
//           </label>
//           <label className="flex mb-4 items-center gap-5">
//             <span className="">balance</span>
//             <span>
//             <input className="border border-slate-300 border-solid py-2 px-3" type="text" name="balance" defaultValue={playerProfile?.balance} />
//             </span>
//           </label>

//           <label className="flex mb-4 items-center gap-5">
//             <span className="">userId</span>
//             <span>{playerProfile?.id}</span>
//           </label>
          
//           <label className="flex mb-4 items-center gap-5">
//             <span className="">email</span>
//             <span>{userProfile?.email}</span>
//           </label>

//           <button type="submit" className="button-blue">
//             送信
//           </button>
//         </div>
//       </form>
//       {/* {user.attributes.email} */}
//     </main>
//   );
// }

// export default withAuthenticator(Page);
