import express, {Request,Response} from "express";
import commentController from "../controllers/comments_controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

router.get("/", commentController.getAll.bind(commentController));

router.get("/:id", (res: Request, req: Response) => {
    commentController.getById(res,req);
});

router.post("/", authMiddleware, commentController.createItem.bind(commentController));

router.put("/:id",authMiddleware, (res: Request, req: Response) => {
    commentController.updateItem(res,req);
});

router.delete("/:id", authMiddleware, (res: Request, req: Response) => {
    commentController.deleteItem(res,req);
});

export default router;