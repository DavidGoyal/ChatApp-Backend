import { Message } from "../models/messageModel.js";
import {Chat} from "../models/chatModel.js"
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { emitEvent, uploadFilesToCloudinary } from "../utils/features.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "../constants/events.js";
import { User } from "../models/userModel.js";



export const sendAttachments=TryCatch(async(req,res,next)=>{
    const {chatId}=req.body;

    if(!req.files||req.files.length===0) return next(new ErrorHandler("No attachments found", 400));

    if(req.files.length>5) return next(new ErrorHandler("Maximum 5 attachments are allowed", 400));

    const [chat,user]=await Promise.all([
        Chat.findById(chatId),
        User.findById(req.user,"name")
    ])

    if(!chat) return next(new ErrorHandler("Chat not found",404));

    const files=req.files||[];
    if(files.length===0) return next(new ErrorHandler("No attachments found", 400));

    const attachments=await uploadFilesToCloudinary(files);

    const messageForRealTime={
        content:"",
        attachments,
        sender:{
            _id:req.user,
            name:user.name,
        },
        chat:chatId,
    };

    const messageForDb={content:"",attachments,sender:req.user,chat:chatId};

    const message=await Message.create(messageForDb);

    emitEvent(req,NEW_MESSAGE,chat.members,{
        message:messageForRealTime,
        chatId
    })

    emitEvent(req,NEW_MESSAGE_ALERT,chat.members,{chatId})

    res.status(201).json({
        success:true,
        message
    })
})


export const getMessages=TryCatch(async(req,res,next)=>{
    const chatId=req.params.id;

    const chat=await Chat.findById(chatId);
    if(!chat.members.includes(req.user.toString())){
        return next(new ErrorHandler("You are not a member of this chat", 403));
    }

    const {page=1}=req.query;

    const limit=20;

    const [messages,totalMessagesCount]=await Promise.all([
        Message.find({chat:chatId}).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).populate("sender","name").lean(),
        Message.countDocuments({chat:chatId})
    ])

    const totalPages=Math.ceil(totalMessagesCount/limit) || 0;

    return res.status(200).json({
        success:true,
        messages:messages.reverse(),
        totalPages,
    })
})