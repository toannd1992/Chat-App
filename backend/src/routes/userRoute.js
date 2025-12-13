import express from "express";
import { authMeController, test } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMeController);

router.get("/test", test);

export default router;
