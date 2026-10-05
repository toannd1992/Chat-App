import express from "express";
import {
  sendDirectMess,
  sendGroupMess,
  editMess,
  recallMess,
  reactMess,
} from "../controllers/messageController.js";
import { pinMessage } from "../controllers/conversationController.js";
import { friendMiddleware } from "../middlewares/friendMiddleware.js";
import { groupMiddleware } from "../middlewares/groupMiddleware.js";

const router = express.Router();

router.post("/direct", friendMiddleware, sendDirectMess);
router.post("/group", groupMiddleware, sendGroupMess);
router.patch("/:messageId", editMess);
router.post("/:messageId/recall", recallMess);
router.post("/:messageId/reaction", reactMess);
router.post("/:messageId/pin", pinMessage);

export default router;
