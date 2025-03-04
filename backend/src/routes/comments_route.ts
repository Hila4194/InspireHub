import express, { Request, Response } from "express";
import commentController from "../controllers/comments_controller";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Comments
 *     description: API for managing comments on posts
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
 *     description: Fetches all comments from the database.
 *     responses:
 *       200:
 *         description: Successfully retrieved comments
 */
router.get("/", commentController.getAll.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Get a single comment by ID
 *     tags: [Comments]
 *     description: Fetch a specific comment by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Successfully retrieved the comment
 *       404:
 *         description: Comment not found
 */
router.get("/:id", (req: Request, res: Response) => {
    commentController.getById(req, res);
});

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     description: Allows a logged-in user to create a new comment on a post.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "60a7c5f2b6e6f8b5f4d2b30b"
 *               content:
 *                 type: string
 *                 example: "This is my comment!"
 *     responses:
 *       201:
 *         description: Successfully created a new comment
 *       400:
 *         description: Invalid request data
 */
router.post("/", authMiddleware, commentController.createItem.bind(commentController));

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     description: Allows a user to update their own comment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated comment content"
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       404:
 *         description: Comment not found
 */
router.put("/:id", authMiddleware, (req: Request, res: Response) => {
    commentController.updateItem(req, res);
});

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     description: Allows a user to delete their own comment.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 */
router.delete("/:id", authMiddleware, commentController.deleteItem.bind(commentController));

export default router;