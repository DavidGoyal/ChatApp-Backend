import {Chat} from "../models/chatModel.js"
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { User } from "../models/userModel.js";
import {Message} from "../models/messageModel.js"
import jwt from 'jsonwebtoken';


export const adminLogin=TryCatch(async(req, res, next)=>{
    const {secretKey}=req.body;

    const adminSecretKey=process.env.ADMIN_SECRET_KEY||"David@123"

    if(secretKey!==adminSecretKey){
        return next(new ErrorHandler("Invalid Admin Key",401));
    }

    const token=jwt.sign(secretKey, process.env.JWT_SECRET);

    const options={
        maxAge: 15*60*1000,
        sameSite: "none",
        secure: true,
        httpOnly: true,
    }

    res.status(200).cookie("admin",token,options).json({
        success:true,
        message:"Authenticated Successfully, Welcome Boss"
    })
})


export const adminLogout=TryCatch(async(req, res, next)=>{
    res.cookie("admin", null, {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: "none"
    })

    res.status(200).json({
        success:true,
        message:"Logged Out Successfully"
    })
})


export const verifyAdmin=TryCatch(async(req,res,next)=>{
    return res.status(200).json({
        admin:true
    })
})

export const getAdminUsers=TryCatch(async(req,res,next)=>{
    const users=await User.find();


    const transformedUsers=await Promise.all(
        users.map(async(user)=>{
            const [friends,groups]=await Promise.all([
                await Chat.countDocuments({members:user._id.toString(),groupChat:false}),
                await Chat.countDocuments({members:user._id.toString(), groupChat:true})
            ])
            return{
                _id:user._id,
                name:user.name,
                username:user.username,
                avatar:user.avatar.url,
                friends,
                groups
            }
        })
    )

    res.status(200).json({
        success:true,
        users:transformedUsers
    })
})



export const getAdminChats=TryCatch(async(req,res,next)=>{
    const chats=await Chat.find().populate("creator","name avatar").populate("members","name avatar");


    const transformedChats=await Promise.all(
        chats.map(async({_id,name,members,creator,groupChat})=>{
            const totalMessages=await Message.countDocuments({chat:_id});

            return{
                _id,
                name,
                totalMembers:members.length,
                groupChat,
                avatar:members.slice(0,3).map(({avatar})=>avatar.url),
                totalMessages,
                members:members.map(({avatar})=>avatar.url),
                creator:{
                    name:creator?.name||"None",
                    avatar:creator?.avatar.url||"",
                }
            }
        })
    )

    res.status(200).json({
        success:true,
        chats:transformedChats
    })
})


export const getAdminMessages=TryCatch(async(req, res, next)=>{
    const messages=await Message.find().populate("chat","groupChat").populate("sender", "name avatar");

    const transformedMessages=messages.map((message)=>{
        return{
            _id:message._id,
            content:message.content,
            chat:message.chat._id,
            attachments:message.attachments,
            groupChat:message.chat.groupChat,
            sender:{
                name:message.sender.name,
                avatar:message.sender.avatar.url
            },
            createdAt:message.createdAt
        }
    })

    res.status(200).json({
        success:true,
        messages:transformedMessages
    })
})


export const getAdminStats=TryCatch(async(req, res, next)=>{
    const [users,chats,messages,groupChats]=await Promise.all([
        await User.countDocuments(),
        await Chat.countDocuments(),
        await Message.countDocuments(),
        await Chat.countDocuments({groupChat:true}),
    ])

    const today=new Date();

    const last7Days=new Date();
    last7Days.setDate(today.getDate()-7);

    const last7DaysMessages=await Message.find({
        createdAt:{$gte:last7Days}
    }).select("createdAt");

    const messagesPerDay=new Array(7).fill(0);

    last7DaysMessages.forEach(({createdAt})=>{
        const index=Math.floor((today.getTime()-createdAt.getTime())/(1000*60*60*24));
        messagesPerDay[6-index]++;
    })

    res.status(200).json({
        success:true,
        users,
        chats,
        messages,
        groupChats,
        singleChats:chats-groupChats,
        messagesPerDay
    })
})