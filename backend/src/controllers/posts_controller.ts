import { Request, Response } from 'express';
import postModel, { IPost } from '../models/posts_model';
import BaseController from './base_controller';
import commentModel from '../models/comments_model';

class PostsController extends BaseController<IPost> {
    constructor() {
        super(postModel);
    }

    async createPost (req: Request, res: Response) {
        const senderId = req.params.userId;
        const post = {
            title: req.body.title,
            content: req.body.content,
            sender: senderId
        }
        req.body = post;
        super.create(req, res);
    };

    async getPosts (req: Request, res: Response) {
        super.getAll(req, res, "");

    };

    async getPostById (req: Request, res: Response): Promise<void> {
        super.getById(req, res);
    };

    async getPostsBySender (req: Request, res: Response) {
        super.getAll(req, res, 'sender');
    }

    async updatePost (req: Request, res: Response): Promise<void> {
        const body = req.body;
        const post = {
            title: body.title,
            content: body.content,
            sender: body.sender
        };
        req.body = post;
        super.update(req, res);
    };

    async deletePost(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            // Check if post exists
            const post = await postModel.findById(id);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }

            // Delete all comments linked to the post
            await commentModel.deleteMany({ postId: id });

            // Delete the post
            await post.deleteOne();

            res.status(200).json({ message: 'Post and associated comments deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    };
};

export default new PostsController();