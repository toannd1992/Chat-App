import express from "express";
import {
  signupController,
  signinController,
  signoutController,
  refreshController,
} from "../controllers/authControllers.js";

const router = express.Router();

router.post("/signup", signupController);
router.post("/signin", signinController);
router.post("/signout", signoutController);

// tạo accessToken
router.post("/refresh", refreshController);

export default router;
