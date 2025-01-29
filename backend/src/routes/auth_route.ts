import express from "express";
import { body } from "express-validator";
import { register, login, logout } from "../controllers/auth_controller";

const router = express.Router();

router.post("/register",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 6 characters"),
  ],
  register
);

router.post("/login",
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post("/logout", logout);

export default router;