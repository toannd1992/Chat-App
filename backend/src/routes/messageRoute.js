import express from "express";
import {
  sendDirectMess,
  sendGroupMess,
} from "../controllers/messageController.js";
import { friendMiddleware } from "../middlewares/friendMiddleware.js";
import { groupMiddleware } from "../middlewares/groupMiddleware.js";

const router = express.Router();

router.post("/direct", friendMiddleware, sendDirectMess);
router.post("/group", groupMiddleware, sendGroupMess);

export default router;
