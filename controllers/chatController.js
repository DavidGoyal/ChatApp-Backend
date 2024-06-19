import {Chat} from "../models/chatModel.js"
import { TryCatch } from "../middlewares/error.js";
import { ErrorHandler } from "../utils/utility.js";
import { deletePublicIdFromCloudinary, emitEvent } from "../utils/features.js";
import { ALERT, REFETCH_CHATS } from "../constants/events.js";
import { User } from "../models/userModel.js";
import {Message} from "../models/messageModel.js"


export const newGroupChat=TryCatch(async(req,res,next)=>{
    const {members,name}=req.body

    const allMembers=[...members,req.user]

    const groupChat=await Chat.create({
        name,
        groupChat:true,
        members:allMembers,
        creator:req.user,
    })

    emitEvent(req,ALERT,allMembers,{message:`Welcome to ${name} group`,chatId:groupChat._id});
    emitEvent(req, REFETCH_CHATS, allMembers);

    res.status(201).json({
        success:true,
        message:"Group created successfully",
        groupChat
    })
})


export const getMyChats=TryCatch(async(req, res, next)=>{
    const chats=await Chat.find({
        members:req.user
    }).populate("members").populate("members","name username avatar")

    const transformedChats=chats.map((chat)=>{
        const otherMembers=chat.members.filter((member)=>member._id.toString()!==req.user.toString());
      
        return{
            _id:chat._id,
            groupChat:chat.groupChat,
            name:chat.groupChat?chat.name:otherMembers[0].name,
            avatar:chat.groupChat?chat.members.slice(0,3).map(({avatar})=>avatar.url):[otherMembers[0].avatar.url],
            creator:chat.creator,
            members:chat.members.reduce((prev,curr)=>{
                if(curr._id.toString()!==req.user.toString()){
                    prev.push(curr._id)
                }
                return prev;
            },[])
        }
    })

    res.status(200).json({
        success:true,
        chats:transformedChats
    })
})


export const getMyGroups=TryCatch(async(req, res, next)=>{
    const groups=await Chat.find({
        members:req.user,
        groupChat:true,
        creator:req.user 
    }).populate("members").populate("members", "name avatar")

    const transformedGroups=groups.map((group)=>{
        return{
            _id:group._id,
            name:group.name,
            avatar:group.members.slice(0, 3).map(({avatar})=>avatar.url),
            groupChat:group.groupChat,
        }
    })

    res.status(200).json({
        success:true,
        groups:transformedGroups
    })
})


export const addGroupMembers=TryCatch(async(req,res,next)=>{
    const {chatId,members}=req.body

    const chat=await Chat.findById(chatId)

    if(!chat){
        return next(new ErrorHandler("Group does not exists", 404))
    }

    if(!chat.groupChat){
        return next(new ErrorHandler("Not a group chat", 400))
    }

    if(chat.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not allowed to add members", 403))
    }

    const allMembersPromise=members.map((i)=>User.findById(i,"name"));

    const allMembers=await Promise.all(allMembersPromise);


    chat.members.push(...allMembers.map((i)=>i._id));

    if(chat.members.length>100){
        return next(new ErrorHandler("Maximum 100 members are allowed", 400))
    }

    await chat.save();

    const allUsersName=allMembers.map((i)=>i.name).join(", ");

    emitEvent(req,ALERT,chat.members,{message:`${allUsersName} has been added in the group`,chatId});
    emitEvent(req, REFETCH_CHATS, [...allMembers.map((i)=>i._id)]);

    res.status(200).json({
        success:true,
        message:`${allUsersName} has been added in the group`,
        chat
    })
})


export const removeGroupMember=TryCatch(async(req,res,next)=>{
    const {chatId,userId}=req.body

    const [chat,userThatWillBeRemoved]=await Promise.all([
        Chat.findById(chatId),
        User.findById(userId,"name")
    ])

    if(!chat){
        return next(new ErrorHandler("Group does not exists", 404))
    }

    if(!chat.groupChat){
        return next(new ErrorHandler("Not a group chat", 400))
    }

    if(chat.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not allowed to remove members", 403))
    }

    if(chat.creator.toString()===userId.toString()){
        return next(new ErrorHandler("Admin cannot be removed", 400))
    }

    if(!chat.members.includes(userId)){
        return next(new ErrorHandler("User is not a part of this group", 404))
    }

    if(chat.members.length<=3){
        return next(new ErrorHandler("Group must have at least 3 members", 400))
    }

    chat.members=chat.members.filter((i)=>i.toString()!==userId.toString());

    await chat.save();

    emitEvent(req, ALERT, chat.members, {message:`${userThatWillBeRemoved.name} has been removed from the group`,chatId});
    emitEvent(req, REFETCH_CHATS, [userId.toString()]);

    res.status(200).json({
        success:true,
        message:`${userThatWillBeRemoved.name} has been removed from the group`,
        chat
    })
})


export const leaveGroup=TryCatch(async(req,res,next)=>{
    const userId=req.user;
    const chatId=req.params.id;

    let isAdmin=false;


    const chat=await Chat.findById(chatId)
    const user=await User.findById(userId,"name")

    if(!chat){
        return next(new ErrorHandler("Group does not exists", 404))
    }

    if(!chat.groupChat){
        return next(new ErrorHandler("Not a group chat", 400))
    }

    const RemainingMembers=chat.members.filter((i)=>i.toString()!==userId.toString());

    if(chat.creator.toString()===userId.toString()){
        const randomIndex=Math.floor(Math.random()*RemainingMembers.length);
        chat.creator=RemainingMembers[randomIndex];
        isAdmin=true;
    }

    chat.members=RemainingMembers;

    await chat.save();

    emitEvent(req, ALERT, chat.members, {message:`${user.name} has left the group`,chatId});

    if(isAdmin){
        const newAdmin=await User.findById(chat.creator,"name");
        emitEvent(req, ALERT, chat.members, {message:`${newAdmin.name} is now the admin`,chatId});
    }

    res.status(200).json({
        success:true,
        message:"Left the group successfully",
        chat
    })
})


export const getChatDetails=TryCatch(async(req, res, next)=>{
    if(req.query.populate==="true"){
        const chat=await Chat.findById(req.params.id).populate("members","name avatar").lean();

        if(!chat){
            return next(new ErrorHandler("Chat does not exists", 404))
        }

        chat.members=chat.members.map(({_id,name,avatar})=>({
            _id,
            name,
            avatar:avatar.url
        }))

        res.status(200).json({
            success:true,
            chat
        })
    }
    else{
        const chat=await Chat.findById(req.params.id);

        if(!chat){
            return next(new ErrorHandler("Chat does not exists", 404))
        }

        res.status(200).json({
            success:true,
            chat
        })
    }
})



export const renameGroup=TryCatch(async(req, res, next)=>{
    const {name}=req.body

    const chatId=req.params.id

    const chat=await Chat.findById(chatId)

    if(!chat){
        return next(new ErrorHandler("Group does not exists", 404))
    }

    if(!chat.groupChat){
        return next(new ErrorHandler("Not a group chat", 400))
    }

    if(chat.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not allowed to rename the group", 403))
    }

    chat.name=name;

    await chat.save();

    emitEvent(req, ALERT, chat.members, {message:`Group name has been changed to ${name}`,chatId});
    emitEvent(req, REFETCH_CHATS, chat.members);

    res.status(200).json({
        success:true,
        message:"Group name changed successfully",
        chat
    })
})


export const deleteChat=TryCatch(async(req, res, next)=>{
    const chatId=req.params.id;

    const chat=await Chat.findById(chatId);

    if(!chat){
        return next(new ErrorHandler("Chat does not exists", 404))
    }

    const members=chat.members;

    if(chat.groupChat&&chat.creator.toString()!==req.user.toString()){
        return next(new ErrorHandler("You are not authorised to delete this group", 403))
    }

    if(chat.groupChat&&!members.includes(req.user.toString())){
        return next(new ErrorHandler("You are not a part of this group",403))
    }

    const messagesWithAttachments=await Message.find({
        chat:chatId,
        attachments:{$exists:true,$ne:[]}
    });

    const public_ids=messagesWithAttachments.map(({attachments})=>attachments.map(({public_id})=>public_id));

    await Promise.all([
        deletePublicIdFromCloudinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({chat:chatId})
    ])

    emitEvent(req,REFETCH_CHATS,members);

    res.status(200).json({
        success:true,
        message:"Chat deleted successfully"
    })
})