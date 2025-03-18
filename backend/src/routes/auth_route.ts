import express from "express";
import authController from "../controllers/auth_controller";
import { upload } from "./upload_route";
import userController from "../controllers/user_controller";
import { authMiddleware } from "../controllers/auth_controller";

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
router.post("/register",upload.single("profilePicture"),authController.register);

router.post("/google", authController.googleSignin);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logs in a user with username and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user
 *               password:
 *                 type: string
 *                 description: The user password
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

/**
 * @swagger
 * /api/auth/update-profile/{id}:
 *   put:
 *     summary: Update user's profile
 *     description: Updates a user's profile by allowing them to change their username and upload a new profile picture.
 *     tags: 
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose profile is being updated
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The updated username of the user
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: The new profile picture file (optional)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The user's ID
 *                     username:
 *                       type: string
 *                       description: The updated username
 *                     profilePictureUrl:
 *                       type: string
 *                       description: The URL of the updated profile picture
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/update-profile/:id", authMiddleware, upload.single("profilePicture"), userController.updateProfile);

export default router;