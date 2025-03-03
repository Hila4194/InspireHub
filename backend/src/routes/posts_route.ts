import express, {Request,Response,NextFunction} from "express";
import postcontroller from "../controllers/posts_controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

router.get("/", postcontroller.getAll.bind(postcontroller));

router.get("/:id", (res: Request, req: Response) => {
    postcontroller.getById(res,req);
});

router.post("/",authMiddleware, postcontroller.createItem.bind(postcontroller));

router.put("/:id", authMiddleware, (res: Request, req: Response) => {
    postcontroller.updateItem(res,req);
});

router.delete("/:id", authMiddleware, postcontroller.deleteItem.bind(postcontroller));

export default router;