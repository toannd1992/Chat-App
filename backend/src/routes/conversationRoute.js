import express from "express";
import {
  createConversation,
  deleteConversation,
  getAllConversation,
  getMessage,
  addMembers,
  removeMember,
  renameGroup,
  setAdmin,
  transferOwner,
  setPersonal,
  searchMessages,
} from "../controllers/conversationController.js";

const router = express.Router();

router.get("/all", getAllConversation);
router.post("/", createConversation);
router.get("/:conversationId/message", getMessage);
router.post("/:conversationId/delete", deleteConversation);
router.get("/:conversationId/search", searchMessages);
router.post("/:conversationId/members", addMembers);
router.post("/:conversationId/members/:userId/remove", removeMember);
router.post("/:conversationId/rename", renameGroup);
router.post("/:conversationId/admins/:userId", setAdmin);
router.post("/:conversationId/transfer/:userId", transferOwner);
router.post("/:conversationId/settings/:setting", setPersonal);

export default router;
