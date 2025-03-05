import express from 'express';
const router = express.Router();
import authController from '../controllers/auth_controller';

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication API
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password
 *       example:
 *         email: "bob@gmail.com"
 *         password: "123456"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registers a new user
 *     tags: 
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The new user registered successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logs in a user
 *     tags: 
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The user logged in successfully
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Generates a new refresh token
 *     tags: 
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refresh token generated successfully
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logs out a user
 *     tags: 
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: The user logged out successfully
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.post('/logout', authController.logout);

export default router;