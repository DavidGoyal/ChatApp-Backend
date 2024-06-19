import {body,validationResult, param} from "express-validator"
import { ErrorHandler } from "../utils/utility.js";


export const registerValidator=()=>[
    body("name","Please Enter Name").notEmpty(),
    body("username","Please Enter Username").notEmpty(),
    body("password","Please Enter Password").notEmpty(),
    body("bio","Please Enter Bio").notEmpty(),
]


export const loginValidator=()=>[
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
]


export const newGroupValidator=()=>[
    body("name", "Please Enter Name").notEmpty(),
    body("members").notEmpty().withMessage("Please Add Members").isArray({min:2, max:100}).withMessage("Members must be 2-100"),
]


export const addMembersValidator=()=>[
    body("chatId").notEmpty().withMessage("Chat Id is required"),
    body("members").notEmpty().withMessage("Please Add Members").isArray({min:1, max:97}).withMessage("Members must be 1-97"),
]


export const removeMemberValidator=()=>[
    body("chatId").notEmpty().withMessage("Chat Id is required"),
    body("userId").notEmpty().withMessage("User Id is required"),
]


export const renameGroupValidator=()=>[
    param("id").notEmpty().withMessage("Chat Id is required"),
    body("name", "Please Enter New Group Name").notEmpty(),
]


export const sendAttachmentsValidator=()=>[
    body("chatId").notEmpty().withMessage("Chat Id is required"),
]


export const chatIdValidator=()=>[
    param("id").notEmpty().withMessage("Chat Id is required"),
]


export const sendRequestValidator=()=>[
    body("userId").notEmpty().withMessage("User Id is required"),
]


export const acceptRequestValidator=()=>[
    body("requestId").notEmpty().withMessage("Request Id is required"),
    body("accept").notEmpty().withMessage("Accept is required").isBoolean().withMessage("Accept must be a boolean"),
]


export const adminLoginValidator=()=>[
    body("secretKey").notEmpty().withMessage("Secret Key is required"),
]


export const validate=(req,res,next)=>{
    const errors=validationResult(req);

    const errorMessages=errors.array().map((error)=>error.msg).join(",");

    if(errors.isEmpty()){
        return next();
    }
    else{
        return next(new ErrorHandler(errorMessages,400));
    }
}