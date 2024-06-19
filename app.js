import express from 'express';
import { connectDb } from './utils/features.js';
import dotenv from 'dotenv';
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import {createServer} from "http"
import { CHAT_JOINED, CHAT_LEFT, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from './constants/events.js';
import {v4 as uuid} from "uuid"
import { getSocketIds } from './lib/helper.js';
import { Message } from './models/messageModel.js';
import cors from "cors"
import {v2 as cloudinary} from 'cloudinary'
import { socketAuthenticator } from './middlewares/auth.js';



import userRouter from "./routes/userRoutes.js"
import chatRouter from "./routes/chatRoutes.js"
import messageRouter from "./routes/messageRoutes.js"
import requestRouter from "./routes/requestRoutes.js"
import adminRouter from "./routes/adminRoutes.js"


dotenv.config({path:"./.env"})

const MONGO_URI=process.env.MONGO_URI
const PORT=process.env.PORT||3000
const envMode=process.env.NODE_ENV.trim()||"PRODUCTION";

export const userSocketIDs=new Map(); 
const onlineUsers=new Set();


connectDb(MONGO_URI)

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})


const app=express();
const server=createServer(app);
const io=new Server(server,{
    cors:{
        origin:["http://localhost:5173","http://localhost:4173",process.env.CLIENT_SERVER],
        credentials:true,
    }
});

app.set("io",io);

app.use(cors({
    origin:["http://localhost:5173","http://localhost:4173",process.env.CLIENT_SERVER],
    credentials:true,
}))


app.use(express.json())
app.use(cookieParser())

app.use("/api/v1/user",userRouter)
app.use("/api/v1/chat",chatRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/request", requestRouter);
app.use("/api/v1/admin", adminRouter);




io.use((socket, next) => {
  cookieParser()(
    socket.request, 
    socket.request.res, 
    async (err) =>await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
    const user=socket.user;

    userSocketIDs.set(user._id.toString(), socket.id);

    socket.on(NEW_MESSAGE,async({chatId,members,message})=>{

        const messageForRealTime={
            content:message,
            _id:uuid(),
            chat:chatId,
            sender:{
                _id:user._id,
                name:user.name
            },
            createdAt:new Date().toISOString()
        }

        const messageForDb={
            content:message,
            chat:chatId,
            sender:user._id,
        }

        const socketIds=getSocketIds(members);
        io.to(socketIds).emit(NEW_MESSAGE,{
            chatId,
            message:messageForRealTime
        })
        io.to(socketIds).emit(NEW_MESSAGE_ALERT,{chatId});

        try {
            await Message.create(messageForDb);
        } catch (error) {
            throw new Error(error);
        }
    })


    socket.on(START_TYPING,({members,chatId})=>{
        const socketIds=getSocketIds(members);
        socket.to(socketIds).emit(START_TYPING, {chatId});
    })

    socket.on(STOP_TYPING,({members,chatId})=>{
        const socketIds=getSocketIds(members);
        socket.to(socketIds).emit(STOP_TYPING, {chatId});
    })

    socket.on(CHAT_JOINED,({userId,members})=>{
        onlineUsers.add(userId.toString());

        const socketIds=getSocketIds(members);
        io.to(socketIds).emit(ONLINE_USERS,Array.from(onlineUsers))
    })

    socket.on(CHAT_LEFT,({userId,members})=>{
        onlineUsers.delete(userId.toString());

        const socketIds=getSocketIds(members);
        io.to(socketIds).emit(ONLINE_USERS,Array.from(onlineUsers))
    })


    socket.on("disconnect", () => {
        userSocketIDs.delete(user._id.toString());
        onlineUsers.delete(user._id.toString());
        socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers))
    });
});



app.use(errorMiddleware);



server.listen(PORT,()=>{
    console.log(`server is running on port ${PORT} IN ${envMode} mode`);
})