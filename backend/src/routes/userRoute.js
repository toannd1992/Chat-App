import express from "express";
import {
  authMeController,
  searchUserController,
  updateAvatarController,
  updateProfileController,
  changePasswordController,
  logoutAllController,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMeController);
router.post("/avatar", updateAvatarController);
router.post("/update", updateProfileController);
router.get("/search", searchUserController);
router.post("/password", changePasswordController);
router.post("/logout-all", logoutAllController);

export default router;
