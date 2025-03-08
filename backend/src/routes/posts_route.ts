import express from 'express';
const router = express.Router();
import postController from '../controllers/posts_controller';
import { authMiddleware } from '../controllers/auth_controller';

/**
 * @swagger
 * tags:
 *   - name: Posts
 *     description: Posts API
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - sender
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the post
 *         content:
 *           type: string
 *           description: The content of the post
 *         sender:
 *           type: string
 *           description: The user ID who created the post
 *       example:
 *         title: "Example Post"
 *         content: "This is the content of the example post."
 *         sender: "60f7c1d8b2b3c8123c456789"
 */

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Creates a new post
 *     tags: 
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user creating the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the post
 *               content:
 *                 type: string
 *                 description: The content of the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The post ID
 *                 title:
 *                   type: string
 *                   description: The title of the post
 *                 content:
 *                   type: string
 *                   description: The content of the post
 *                 sender:
 *                   type: string
 *                   description: The user who created the post
 *       400:
 *         description: Missing required fields (title or content)
 *       500:
 *         description: Internal server error
 */
router.post('/', authMiddleware,  postController.createPost.bind(postController));

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Gets all posts
 *     tags: 
 *       - Posts
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Internal server error
 */
router.get('/', postController.getPosts.bind(postController));

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Gets a post by ID
 *     tags: 
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', postController.getPostById.bind(postController));

/**
 * @swagger
 * /api/posts/sender/{sender}:
 *   get:
 *     summary: Gets posts by sender
 *     tags: 
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: sender
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the sender
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Internal server error
 */
router.get('/sender/:sender', postController.getPostsBySender.bind(postController));

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Updates a post by ID
 *     tags: 
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authMiddleware, postController.updatePost.bind(postController));

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Deletes a post by ID **and all associated comments**
 *     tags: 
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to delete
 *     responses:
 *       200:
 *         description: Post and associated comments deleted successfully
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authMiddleware, postController.deletePost.bind(postController));

export default router;