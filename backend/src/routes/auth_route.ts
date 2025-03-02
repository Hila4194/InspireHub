import express, {Request,Response} from "express";
import authcontroller from "../controllers/auth_controller";

const router = express.Router();

router.post("/register", authcontroller.register);

router.post("/login", authcontroller.login);

router.post("/logout", authcontroller.logout);

router.post("/refresh", authcontroller.refresh);

export default router;