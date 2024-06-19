import express from "express"
import { getMyFriends, getMyProfile, loginUser, logoutUser, registerUser, searchUser } from "../controllers/userController.js"
import { singleMulter } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { loginValidator, registerValidator, validate } from "../lib/validators.js";

const router = express.Router()


router.post("/new",singleMulter,registerValidator(),validate,registerUser);
router.post("/login",loginValidator(),validate, loginUser);


router.use(isAuthenticated);
router.get("/me",getMyProfile);
router.get("/logout", logoutUser);
router.get("/search",searchUser);
router.get("/friends",getMyFriends);



export default router;