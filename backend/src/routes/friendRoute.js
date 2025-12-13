import express from "express";

import {
  sendFriend,
  acceptFriendRequest,
  declineFriendRequest,
  getAllFriends,
  getFriendsRequest,
} from "../controllers/friendControllers.js";

const router = express.Router();

router.post("/request", sendFriend);
router.post("/requests/:requestId/accept", acceptFriendRequest);
router.post("/requests/:requestId/decline", declineFriendRequest);
router.get("/all", getAllFriends);
router.get("/requests", getFriendsRequest);

export default router;
