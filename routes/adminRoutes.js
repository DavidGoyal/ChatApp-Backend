import express from "express"
import { isAdminAuthenticated, isAuthenticated } from "../middlewares/auth.js";
import { adminLogin, adminLogout, getAdminChats, getAdminMessages, getAdminStats, getAdminUsers, verifyAdmin } from "../controllers/adminController.js";
import { adminLoginValidator, validate } from "../lib/validators.js";

const router = express.Router()

router.use(isAuthenticated);

router.post("/login",adminLoginValidator(),validate,adminLogin);
router.get("/logout",adminLogout)

router.use(isAdminAuthenticated);

router.get("/",verifyAdmin);

router.get("/users",getAdminUsers);
router.get("/chats",getAdminChats);
router.get("/messages",getAdminMessages);
router.get("/dashboard",getAdminStats);

export default router;