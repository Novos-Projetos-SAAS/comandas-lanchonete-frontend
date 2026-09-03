import { io } from "socket.io-client";

let socket=null;

export function obterSocket(){
    if(typeof window==="undefined")return null;
    if(socket)return socket;

    const apiUrl=process.env.NEXT_PUBLIC_API_URL||"http://localhost:3333/api";

    let socketUrl="http://localhost:3333";

    try{
        socketUrl=new URL(apiUrl).origin;
    }catch{}

    socket=io(socketUrl,{
        autoConnect:false,
        withCredentials:true,
        transports:["websocket","polling"]
    });

    return socket;
}