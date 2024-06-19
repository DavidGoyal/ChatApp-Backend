import { compare } from "bcrypt";
import {User} from "../models/userModel.js"
import {Chat} from "../models/chatModel.js"
import { sendToken, uploadFilesToCloudinary } from "../utils/features.js";
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";


export const registerUser=TryCatch(async(req,res,next)=>{

    const {name,username,password,bio}=req.body;

    if(!req.file){
        return next(new ErrorHandler("Please Upload Avatar", 400));
    }

    const result=await uploadFilesToCloudinary([req.file])


    const avatar={
        public_id:result[0].public_id,
        url:result[0].url
    }

    const user=await User.create({name,username,password,bio,avatar})

    sendToken(res,user,201,"User created successfully");
})


export const loginUser=TryCatch(async(req, res,next)=>{
    const {username, password}=req.body;

    const user=await User.findOne({username}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid Credentials",404));
    }

    const isMatch=await compare(password, user.password);

    if(!isMatch){
        return next(new ErrorHandler("Invalid Credentials",404));
    }

    sendToken(res,user,200,`Welcome back ${user.name}`)
})


export const getMyProfile=TryCatch(async(req, res)=>{
    const user=await User.findById(req.user);

    res.status(200).json({
        success:true,
        user
    })
})


export const logoutUser=TryCatch(async(req, res)=>{
    res.cookie("token", null, {
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


export const searchUser=TryCatch(async(req,res,next)=>{
    const {name=""}=req.query;

    const myChats=await Chat.find({groupChat:false,members:req.user})

    const allUsersFromMyChats=myChats.flatMap((chat)=>chat.members);

    allUsersFromMyChats.push(req.user);

    const allUsersExceptMeAndMyFriends=await User.find({
        _id:{$nin:allUsersFromMyChats},
        name:{$regex:name, $options:"i"}
    })

    const users=allUsersExceptMeAndMyFriends.map(({_id,name,avatar})=>({
        _id,
        name,
        avatar:avatar.url
    }));

    res.status(200).json({
        success:true,
        users
    })
})



export const getMyFriends=TryCatch(async(req, res)=>{
    const chatId=req.query.chatId;

    const myChats=await Chat.find({groupChat:false, members:req.user}).populate("members","name avatar");

    const friends=myChats.map(({members})=>{
        const otherUser=members.filter((member)=>member._id.toString()!==req.user.toString());
        return{
            _id:otherUser[0]._id,
            name:otherUser[0].name,
            avatar:otherUser[0].avatar.url,
        }
    })

    if(chatId){
        const chat=await Chat.findById(chatId);

        const availableFriends=friends.filter((friend)=>!chat.members.includes(friend._id));

        res.status(200).json({
            success:true,
            friends:availableFriends
        })
    }
    else{
        res.status(200).json({
            success:true,
            friends
        })
    }
})