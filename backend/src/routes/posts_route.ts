import express, { Request, Response, NextFunction } from "express";
import postcontroller from "../controllers/posts_controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Posts
 *     description: API for managing user posts
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     description: Fetches all posts from the database.
 *     responses:
 *       200:
 *         description: Successfully retrieved posts
 */
router.get("/", postcontroller.getAll.bind(postcontroller));

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 *     description: Fetch a specific post by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Successfully retrieved the post
 *       404:
 *         description: Post not found
 */
router.get("/:id", (req: Request, res: Response) => {
    postcontroller.getById(req, res);
});

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     description: Allows a logged-in user to create a new post.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My First Post"
 *               content:
 *                 type: string
 *                 example: "This is my first post!"
 *     responses:
 *       201:
 *         description: Successfully created a new post
 *       400:
 *         description: Invalid request data
 */
router.post("/", authMiddleware, postcontroller.createItem.bind(postcontroller));

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     description: Allows a user to update their own post.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Title"
 *               content:
 *                 type: string
 *                 example: "Updated post content"
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 */
router.put("/:id", authMiddleware, (req: Request, res: Response) => {
    postcontroller.updateItem(req, res);
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     description: Allows a user to delete their own post.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 */
router.delete("/:id", authMiddleware, postcontroller.deleteItem.bind(postcontroller));

export default router;