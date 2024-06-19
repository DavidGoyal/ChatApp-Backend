import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from 'cloudinary';
import {v4 as uuid} from "uuid"
import { getBase64, getSocketIds } from "../lib/helper.js";

export const connectDb=(uri)=>{
    mongoose.connect(uri,{dbName:"Chattu"}).then((data)=>{
        console.log(`Database connected to ${data.connection.host}`);
    }).catch((err)=>{
        throw err;
    })
}


export const sendToken=(res,user,code,message)=>{
    const token = jwt.sign({_id:user._id},process.env.JWT_SECRET);
    const options = {
        maxAge: 15*24*60*60*1000,
        sameSite: "none",
        secure: true,
        httpOnly: true,
    };
    res.status(code).cookie("token", token, options).json({
        success: true,
        message,
        user,
    });
}


export const emitEvent=(req,event,users,data)=>{
  const io=req.app.get("io")
  const usersSockets=getSocketIds(users);

  io.to(usersSockets).emit(event, data);
}



export const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  });
  try {
    const results = await Promise.all(uploadPromises);
    const formattedResults = results.map((result) => {
      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    });
    return formattedResults;
  } catch (error) {
    throw new Error("Failed to upload files to Cloudinary",error);
  }
};


export const deletePublicIdFromCloudinary=async(publicIds)=>{
  for (let index = 0; index < publicIds.length; index++) {
    await cloudinary.uploader.destroy(publicIds[index]);
  }
}