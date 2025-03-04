import express from "express";
import authcontroller from "../controllers/auth_controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication API
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Successfully registered
 *       400:
 *         description: Registration failed
 */
router.post("/register", authcontroller.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     description: Authenticates a user and returns access & refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       400:
 *         description: Incorrect email or password
 */
router.post("/login", authcontroller.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     description: Invalidates the user's session
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post("/logout", authcontroller.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh the authentication token
 *     tags: [Auth]
 *     description: Generates a new access token using a refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "your_refresh_token"
 *     responses:
 *       200:
 *         description: New access token generated
 *       400:
 *         description: Invalid refresh token
 */
router.post("/refresh", authcontroller.refresh);

export default router;