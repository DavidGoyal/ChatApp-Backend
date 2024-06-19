import express from "express"
import { isAuthenticated } from "../middlewares/auth.js";
import { addGroupMembers, deleteChat, getChatDetails, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeGroupMember, renameGroup } from "../controllers/chatController.js";
import { addMembersValidator, chatIdValidator, newGroupValidator, removeMemberValidator, renameGroupValidator, validate } from "../lib/validators.js";

const router = express.Router()


router.use(isAuthenticated);


router.post("/new",newGroupValidator(),validate,newGroupChat);
router.get("/my",getMyChats);
router.get("/my/groups",getMyGroups);
router.put("/addmembers",addMembersValidator(),validate,addGroupMembers);
router.put("/removemember",removeMemberValidator(),validate,removeGroupMember);
router.delete("/leave/:id",chatIdValidator(),validate,leaveGroup);

router
  .route("/:id")
  .get(chatIdValidator(), validate, getChatDetails)
  .put(renameGroupValidator(), validate, renameGroup)
  .delete(chatIdValidator(), validate, deleteChat);

export default router;