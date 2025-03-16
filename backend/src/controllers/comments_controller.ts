import { Request, Response } from 'express';
import commentModel, { IComment } from '../models/comments_model';
import BaseController from './base_controller';
import { AuthenticatedRequest } from '../../types';
import postModel from '../models/posts_model';

class CommentsController extends BaseController<IComment> {
    constructor() {
        super(commentModel);
    }

    async createComment(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user || !req.user.id) {
                res.status(403).json({ message: "Unauthorized: User ID is missing." });
                return;
            }

            const { content, postId } = req.body;
            const senderId = req.user.id;

            if (!content || !postId) {
                res.status(400).json({ message: "Content and post ID are required." });
                return;
            }

            const newComment = await commentModel.create({ content, sender: senderId, postId });

            // Increment comments count on the post
            await postModel.findByIdAndUpdate(postId, { $push: { comments: newComment._id } });

            res.status(201).json(newComment);
        } catch (error) {
            console.error("❌ Error creating comment:", error);
            res.status(500).json({ message: "Failed to create comment." });
        }
    };

    async getCommentById (req: Request, res: Response): Promise<void> {
        super.getById(req, res);
    };

    async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { content } = req.body;
            const commentId = req.params.id;
            const userId = req.user?.id;

            const comment = await commentModel.findById(commentId);
            if (!comment) {
                res.status(404).json({ message: "Comment not found." });
                return;
            }

            // Ensure only the owner can edit
            if (comment.sender.toString() !== userId) {
                res.status(403).json({ message: "Unauthorized to edit this comment." });
                return;
            }

            comment.content = content;
            await comment.save();

            res.status(200).json(comment);
        } catch (error) {
            console.error("❌ Error updating comment:", error);
            res.status(500).json({ message: "Failed to update comment." });
        }
    };

    async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const commentId = req.params.id;
            const userId = req.user?.id;

            const comment = await commentModel.findById(commentId);
            if (!comment) {
                res.status(404).json({ message: "Comment not found." });
                return;
            }

            // Ensure only the owner can delete
            if (comment.sender.toString() !== userId) {
                res.status(403).json({ message: "Unauthorized to delete this comment." });
                return;
            }

            await comment.deleteOne();

            // Remove comment reference from the post
            await postModel.findByIdAndUpdate(comment.postId, { $pull: { comments: commentId } });

            res.status(200).json({ message: "Comment deleted successfully" });
        } catch (error) {
            console.error("❌ Error deleting comment:", error);
            res.status(500).json({ message: "Failed to delete comment." });
        }
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
                .sort({ createdAt: 1 }); // Ensures oldest comments appear first

            res.status(200).json(comments);
        } catch (error) {
            console.error("❌ Error fetching comments:", error);
            res.status(500).json({ message: "Error fetching comments" });
        }
    };
};

export default new CommentsController();