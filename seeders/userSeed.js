import { Chat } from "../models/chatModel.js"
import {User} from "../models/userModel.js"
import {Message} from "../models/messageModel.js"
import {faker} from "@faker-js/faker"

export const createUser=async(numUsers)=>{
    try {
        
        const usersPromise=[]

        for (let index = 0; index < numUsers; index++) {
            const tempUser=User.create({
                name:faker.person.fullName(),
                username:faker.internet.userName(),
                password:"password",
                bio:faker.lorem.sentence(10),
                avatar:{
                    public_id:faker.system.fileName,
                    url:faker.image.avatar()
                }
            })

            usersPromise.push(tempUser)
            
        }

        await Promise.all(usersPromise)

        console.log("Users created",numUsers);
        process.exit(1);

    } catch (error) {
        console.error(error)
        process.exit(1);
    }
}


export const createSampleChats=async(numChats)=>{
    try {
        const users=await User.find().select("_id");

        const chatPromises=[];

        for (let i = 0; i < users.length; i++) {
            for (let j = i+1; j < users.length; j++) {
                const tempChat=Chat.create({
                    name:faker.lorem.words(2),
                    members:[users[i]._id,users[j]._id]
                })
                chatPromises.push(tempChat)
            }
        }

        await Promise.all(chatPromises);
        console.log("Chats created successfully");
        process.exit(1);
    } catch (error) {
        console.error(error)
        process.exit(1);
    }
}


export const createSampleMessages=async(numMessages)=>{
    try {
        const chats=await Chat.find().select("_id");
        const users=await User.find().select("_id");

        const messagePromises=[];

        for (let i = 0; i < numMessages; i++) {
            const randomUser=Math.floor(Math.random()*users.length)
            const randomChat=Math.floor(Math.random()*chats.length)
            const tempMessage=Message.create({
                chat:chats[randomChat]._id,
                sender:users[randomUser]._id,
                content:faker.lorem.sentence(10)
            })
            messagePromises.push(tempMessage)
        }

        await Promise.all(messagePromises);
        console.log("Messages created successfully");
        process.exit(1);
    } catch (error) {
        console.error(error)
        process.exit(1);
    }
}



export const createSampleMessagesinChat=async(numMessages,chatId)=>{
    try {
        const users=await User.find().select("_id");

        const messagePromises=[];

        for (let i = 0; i < numMessages; i++) {
            const randomUser=Math.floor(Math.random()*users.length)
            const tempMessage=Message.create({
                chat:chatId,
                sender:users[randomUser]._id,
                content:faker.lorem.sentence(10)
            })
            messagePromises.push(tempMessage)
        }

        await Promise.all(messagePromises);
        console.log("Messages created successfully");
        process.exit(1);
    } catch (error) {
        console.error(error)
        process.exit(1);
    }
}