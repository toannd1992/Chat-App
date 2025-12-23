import express from "express";
import {
  createConversation,
  deleteConversation,
  getAllConversation,
  getMessage,
} from "../controllers/conversationController.js";

const router = express.Router();

router.get("/all", getAllConversation);
router.post("/", createConversation);
router.get("/:conversationId/message", getMessage);
router.post("/:conversationId/delete", deleteConversation);

export default router;
