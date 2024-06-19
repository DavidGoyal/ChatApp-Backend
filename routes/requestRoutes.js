import express from "express"
import { isAuthenticated } from "../middlewares/auth.js";
import { acceptRequest, getAllNotifications, sendRequest } from "../controllers/requestController.js";
import { acceptRequestValidator, sendRequestValidator, validate } from "../lib/validators.js";

const router = express.Router()


router.use(isAuthenticated);

router.put("/send",sendRequestValidator(),validate,sendRequest)

router.put("/accept",acceptRequestValidator(),validate,acceptRequest);

router.get("/notifications",getAllNotifications);


export default router;