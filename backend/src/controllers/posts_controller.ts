import { Request, Response } from 'express';
import postModel, { IPost } from '../models/posts_model';
import BaseController from './base_controller';
import commentModel from '../models/comments_model';
import { AuthenticatedRequest } from '../../types';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Initialize Google Generative AI API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// This controller handles CRUD operations for posts
class PostsController extends BaseController<IPost> {
    constructor() {
        super(postModel);
    }

    // Create a new post
    async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user || !req.user.id) {
                res.status(403).json({ message: "Unauthorized: User ID is missing." });
                return;
            }
    
            const senderId = req.user.id;
            const { title, content } = req.body;
            const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || "";
            
            // Ensure at least a title and either content or image is provided
            if (!title || (!content && !imageUrl)) {
                res.status(400).json({ message: "Title and either content or an image are required." });
                return;
            }
    
            const post = await postModel.create({
                title,
                content: content || undefined,
                sender: senderId,
                imageUrl,
                comments: []
            });
    
            res.status(201).json(post);
        } catch (error) {
            console.error("❌ Error creating post:", error);
            res.status(500).json({ message: "Failed to create post." });
        }
    }    

    // Retrieves all posts with pagination and user profile pictures
    async getPosts(req: Request, res: Response) {
        try {
            const userId = (req as AuthenticatedRequest).user?.id;
            const limit = parseInt(req.query.limit as string) || 4;  // Default limit is 4
            const skip = parseInt(req.query.skip as string) || 0;  // Offset for pagination
            
            const posts = await this.model.find()
                .populate("sender", "username profilePicture")
                .populate("likes", "_id")
                .populate({
                    path: "comments",
                    populate: { path: "sender", select: "username" }
                })
                .sort({ createdAt: -1 }) // Ensure newest posts appear first
                .skip(skip)
                .limit(limit); // Pagination applied here
    
            const apiBaseUrl = process.env.DOMAIN_BASE?.trim().replace(/\/$/, "");
    
            // Convert likes array into count and format image & profile picture URLs
            const formattedPosts = posts.map(post => {
                const sender = post.sender && typeof post.sender !== 'string' ? post.sender as unknown as { username: string; profilePicture?: string } : undefined;
                
                return {
                    ...post.toObject(),
                    likes: post.likes.length, // Convert likes array into number
                    likedByUser: userId ? post.likes.some((like: any) => like._id.toString() === userId) : false,
                    imageUrl: post.imageUrl?.startsWith("/uploads/") 
                        ? `${apiBaseUrl}${post.imageUrl}`
                        : post.imageUrl,
                    sender: {
                        username: sender?.username || "Unknown User", // Ensure username exists
                        profilePicture: sender?.profilePicture && sender.profilePicture.startsWith("/uploads/")
                            ? `${apiBaseUrl}${sender.profilePicture}`
                            : sender?.profilePicture || "../../uploads/avatar.png" // Default profile picture
                    }
                };
            });
        
            res.json(formattedPosts);
        } catch (error) {
            console.error("❌ Error fetching posts:", error);
            res.status(500).json({ message: "Error fetching posts" });
        }
    }    

    // Retrieves a single post by ID
    async getPostById (req: Request, res: Response): Promise<void> {
        super.getById(req, res);
    };

    // Retrieves posts by a specific sender (user)
    async getPostsBySender(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.userId || req.query.sender;

            if (!userId) {
                res.status(400).json({ error: "User ID is required." });
                return;
            }

            const posts = await this.model.find({ sender: userId })
                .populate("sender", "username")
                .populate("likes", "_id")
                .populate({
                    path: "comments",
                    populate: { path: "sender", select: "username" }
                });

            if (!posts.length) {
                res.status(404).json({ message: "No posts found for this user." });
                return;
            }

            res.json(posts);
        } catch (error) {
            console.error("❌ Error fetching user posts:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    }    

    // Updates a post by ID
    async updatePost(req: Request, res: Response): Promise<void> {
        try {
            console.log("📌 Incoming Update Request:", req.body);
            console.log("📌 Incoming File:", req.file ? req.file.filename : "No file uploaded");
    
            if (req.file) {
                req.body.imageUrl = `/uploads/${req.file.filename}`;
            }

            delete req.body.sender;
    
            super.update(req, res);
        } catch (error) {
            console.error("❌ Error updating post:", error);
            res.status(500).json({ message: "Failed to update post." });
        }
    }    

    // Deletes a post by ID and its associated comments
    async deletePost(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        try {
            const post = await postModel.findById(id);
            if (!post) {
                res.status(404).json({ message: 'Post not found' });
                return;
            }

            await commentModel.deleteMany({ postId: id });

            await post.deleteOne();

            res.status(200).json({ message: 'Post and associated comments deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    };

    // Toggle Like/Unlike on a post
    async toggleLikePost(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { postId } = req.params;
            const userId = req.user?.id;
    
            if (!userId) {
                res.status(401).json({ message: "Unauthorized: User not logged in." });
                return;
            }
    
            const post = await postModel.findById(postId);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
    
            const userObjectId = new mongoose.Types.ObjectId(userId);
    
            // Check if the user has already liked the post
            const likedIndex = post.likes.findIndex((id) => id.toString() === userObjectId.toString());
    
            if (likedIndex === -1) {
                post.likes.push(userObjectId); // Like the post
            } else {
                post.likes.splice(likedIndex, 1); // Unlike the post
            }
    
            await post.save();
            res.status(200).json({ likes: post.likes.length, liked: likedIndex === -1 });
        } catch (error) {
            console.error("❌ Error toggling like:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    }    

    // Generates AI-based post suggestions using Google's Gemini AI
    async getPostSuggestions(req: Request, res: Response): Promise<void> {
        console.log("🔹 Function `getPostSuggestions` was called!");
    
        try {
            const { userInput } = req.body;
            if (!userInput) {
                console.log("❌ Missing input text.");
                res.status(400).json({ message: "Input text is required." });
                return;
            }
    
            const prompt = `Suggest 3 engaging post ideas based on this topic: "${userInput}".`;
    
            console.log("📤 Sending request to Gemini with prompt:", prompt);
    
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
    
            const suggestions = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
            console.log("✅ Gemini AI Suggestions:", suggestions);
            res.json({ suggestions });
        } catch (error: any) {
            console.error("❌ Error generating AI post suggestions:", error);
    
            res.status(500).json({
                message: "Failed to generate post suggestions using Gemini.",
                error: error.message,
            });
        }
    }
};

export default new PostsController();