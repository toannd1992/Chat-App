import express from "express";
import {
  createConversation,
  getAllConversation,
  getMessage,
} from "../controllers/conversationController.js";

const router = express.Router();

router.get("/all", getAllConversation);
router.post("/", createConversation);
router.get("/:conversationId/message", getMessage);

export default router;
