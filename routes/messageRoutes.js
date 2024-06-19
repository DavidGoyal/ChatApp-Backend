import express from "express"
import { attachmentsMulter } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { getMessages, sendAttachments } from "../controllers/messageController.js";
import { chatIdValidator, sendAttachmentsValidator, validate } from "../lib/validators.js";


const router = express.Router()


router.use(isAuthenticated);


router.post("/attachments",attachmentsMulter,sendAttachmentsValidator(),validate,sendAttachments);

router.get("/:id",chatIdValidator(),validate,getMessages);


export default router;