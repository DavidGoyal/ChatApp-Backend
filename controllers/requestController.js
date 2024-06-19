import {User} from "../models/userModel.js"
import {Chat} from "../models/chatModel.js"
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { Request } from "../models/requestModel.js";
import { emitEvent } from "../utils/features.js";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";



export const sendRequest=TryCatch(async(req,res,next)=>{
    const {userId}=req.body;
    const user=await User.findById(userId);

    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }

    let request=await Request.findOne({
        $or:[
            {sender:req.user, receiver:userId}, 
            {sender:userId, receiver:req.user}
        ]
    })

    if(request){
        return next(new ErrorHandler("Request already sent", 400));
    }

    request=await Request.create({
        sender:req.user,
        receiver:userId
    })

    emitEvent(req,NEW_REQUEST,[userId],"Received a new friend request")

    res.status(200).json({
        success:true,
        message:"Friend Request sent",
        request
    })
})



export const acceptRequest=TryCatch(async(req, res, next)=>{
    const {requestId,accept}=req.body;

    let request=await Request.findById(requestId).populate("sender","name").populate("receiver","name");

    if(!request){
        return next(new ErrorHandler("Request not found", 404));
    }

    if(request.receiver._id.toString()!==req.user){
        return next(new ErrorHandler("You are not authorized to accept this request", 401));
    }

    if(!accept){
        await request.deleteOne();
        return res.status(200).json({
            success:true,
            message:"Request rejected"
        })
    }

    const members=[request.sender._id, request.receiver._id]


    await Promise.all([
        Chat.create({
            name:`${request.sender.name}-${request.receiver.name}`,
            members,
        }),
        request.deleteOne()
    ])

    emitEvent(req,REFETCH_CHATS,members)

    res.status(200).json({
        success:true,
        message:`Friend Request ${accept?"accepted":"rejected"}`,
        senderId:request.sender._id
    })
})


export const getAllNotifications=TryCatch(async(req, res, next)=>{
    const requests=await Request.find({receiver:req.user}).populate("sender", "name avatar");

    const allRequests=requests.map(({_id,sender})=>({
        _id,
        sender:{
            _id:sender._id,
            name:sender.name,
            avatar:sender.avatar.url
        }
    }))

    res.status(200).json({
        success:true,
        allRequests
    })
})