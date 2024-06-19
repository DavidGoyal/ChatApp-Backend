import { userSocketIDs } from "../app.js"

export const getSocketIds=(members=[])=>(
    members.map((member)=>userSocketIDs.get(member.toString()))
);



export const getBase64=(file)=>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;