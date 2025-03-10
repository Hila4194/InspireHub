import { Request, Response } from 'express';
import postModel, { IPost } from '../models/posts_model';
import BaseController from './base_controller';
import commentModel from '../models/comments_model';
import { AuthenticatedRequest } from '../../types';

class PostsController extends BaseController<IPost> {
    constructor() {
        super(postModel);
    }

    async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user || !req.user.id) {
                res.status(403).json({ message: "Unauthorized: User ID is missing." });
                return;
            }
    
            const senderId = req.user.id;
            const { title, content } = req.body;
            const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || "";
    
            if (!title || (!content && !imageUrl)) {
                res.status(400).json({ message: "Title and either content or an image are required." });
                return;
            }
    
            const post = await postModel.create({
                title,
                content: content || undefined,
                sender: senderId,
                imageUrl
            });
    
            res.status(201).json(post);
        } catch (error) {
            console.error("❌ Error creating post:", error);
            res.status(500).json({ message: "Failed to create post." });
        }
    }    

    async getPosts(req: Request, res: Response) {
        try {
            const posts = await this.model.find().populate("sender", "username");
            res.json(posts);
        } catch (error) {
            res.status(500).json({ message: "Error fetching posts" });
        }
    }    

    async getPostById (req: Request, res: Response): Promise<void> {
        super.getById(req, res);
    };

    async getPostsBySender(req: Request, res: Response): Promise<void> {
        try {
            const posts = await postModel.find({ sender: req.params.userId });
            res.status(200).json(posts);
        } catch (error) {
            res.status(500).json({ message: (error as Error).message });
        }
    }

    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            const body = req.body;
            const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

            const post = { title: body.title, content: body.content, sender: body.sender, imageUrl };
            req.body = post;
            super.update(req, res);
        } catch (error) {
            res.status(500).json({ message: "Failed to update post." });
        }
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