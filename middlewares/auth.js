import { User } from "../models/userModel.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from 'jsonwebtoken';

export const isAuthenticated=(req,res,next)=>{
    const token=req.cookies["token"];
    if(!token){
        return next(new ErrorHandler("Please Login to access this resource",401));
    }
    const decodedData=jwt.verify(token, process.env.JWT_SECRET);
    req.user=decodedData._id;
    next();
}


export const isAdminAuthenticated=(req, res, next)=>{
    const token=req.cookies["admin"];
    if(!token){
        return next(new ErrorHandler("Only Admin can access this resource", 401));
    }
    const secretKey=jwt.verify(token, process.env.JWT_SECRET);
    const adminSecretKey=process.env.ADMIN_SECRET_KEY||"David@123"

    if(secretKey!==adminSecretKey){
        return next(new ErrorHandler("Only Admin can access this resource",401));
    }
    next();
}



export const socketAuthenticator=async(err,socket, next)=>{
    try {
        if(err){
            return next(err);
        }

        const token=socket.request.cookies["token"];

        if(!token){
            return next(new ErrorHandler("Please Login to access this resource",401));
        }

        const decodedData=jwt.verify(token, process.env.JWT_SECRET);

        const user=await User.findById(decodedData._id);
        if(!user){
            return next(new ErrorHandler("Please Login to access this resource", 401));
        }

        socket.user=user;

        return next();
    } catch (error) {
        return next(new ErrorHandler("Please Login to access this resource",401));
    }
}