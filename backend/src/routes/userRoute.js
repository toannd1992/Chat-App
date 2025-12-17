import express from "express";
import {
  authMeController,
  searchUserController,
  updateAvatarController,
  updateProfileController,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMeController);
router.post("/avatar", updateAvatarController);
router.post("/update", updateProfileController);
router.get("/search", searchUserController);

export default router;
