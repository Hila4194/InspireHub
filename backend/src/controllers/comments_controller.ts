import { Request, Response } from 'express';
import commentModel, { IComment } from '../models/comments_model';
import BaseController from './base_controller';

class CommentsController extends BaseController<IComment> {
    constructor() {
        super(commentModel);
    }

    async createComment (req: Request, res: Response) {
        const comment = {
            content: req.body.content,
            sender: req.body.sender,
            postId: req.body.postId
        }
        req.body = comment;
        super.create(req, res);
    };

    async getCommentById (req: Request, res: Response): Promise<void> {
        super.getById(req, res);
    };

    async updateComment (req: Request, res: Response): Promise<void> {
        const body = req.body;
        const comment = {
            content: body.content,
            sender: body.sender,
            postId: body.postId
        };
        req.body = comment;
        super.update(req, res);
    };

    async deleteComment (req: Request, res: Response): Promise<void> {
        super.delete(req, res);
    };

    async getCommentsByPost(req: Request, res: Response): Promise<void> {
        try {
            const postId = req.params.postId;
    
            if (!postId) {
                res.status(400).json({ message: "Post ID is required." });
                return;
            }
    
            const comments = await commentModel.find({ postId })
                .populate("sender", "_id username")
                .sort({ createdAt: 1 }); // ✅ Ensures oldest comments appear first
    
            res.status(200).json(comments); // ✅ Always return 200, even if empty
        } catch (error) {
            console.error("❌ Error fetching comments:", error);
            res.status(500).json({ message: "Error fetching comments" });
        }
    }    
};

export default new CommentsController();