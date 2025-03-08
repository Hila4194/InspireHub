import express from "express";
import authController from "../controllers/auth_controller";
import multer from "multer";

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

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
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The username (must contain letters and numbers)
 *         email:
 *           type: string
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password (at least 6 characters)
 *       example:
 *         username: "User123"
 *         email: "bob@gmail.com"
 *         password: "123456"
 * 
 *     LoginUser:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *       example:
 *         email: "bob@gmail.com"
 *         password: "123456"
 * 
 *     RefreshToken:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *       example:
 *         refreshToken: "some-refresh-token"
 * 
 *     ProfilePicture:
 *       type: object
 *       properties:
 *         profilePicture:
 *           type: string
 *           format: binary
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registers a new user with a username, email, password, and optional profile picture
 *     tags: 
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "User123"
 *               email:
 *                 type: string
 *                 example: "bob@gmail.com"
 *               password:
 *                 type: string
 *                 example: "123456"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: User's profile picture (optional)
 *     responses:
 *       201:
 *         description: The new user registered successfully
 *       400:
 *         description: Invalid input data (e.g., email already exists, weak password, or invalid username)
 *       500:
 *         description: Internal server error
 */
router.post("/register", upload.single("profilePicture"), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logs in a user and returns authentication tokens
 *     tags: 
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUser'
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
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Generates a new access token using a refresh token
 *     tags: 
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logs out a user and invalidates the refresh token
 *     tags: 
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshToken'
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
router.post("/logout", authController.logout);

export default router;