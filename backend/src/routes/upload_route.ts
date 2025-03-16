import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../controllers/auth_controller";

const router = express.Router();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage with Fixed Filenames
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, safeFilename);
    }
});

// Filter only images
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
});

/**
 * @swagger
 * /api/uploads/profile-picture:
 *   post:
 *     summary: Uploads a new profile picture (authenticated users only)
 *     security:
 *       - bearerAuth: []
 *     tags: 
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       500:
 *         description: Internal server error
 */
router.post("/profile-picture", authMiddleware, upload.single("file"), async (req, res): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded or invalid file type" });
            return;
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        console.log("✅ Profile picture uploaded:", imageUrl);

        res.json({ url: imageUrl });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/post-image", authMiddleware, upload.single("file"), async (req, res): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded or invalid file type" });
            return;
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        console.log("✅ Post image uploaded:", imageUrl);
        res.json({ url: imageUrl });
    } catch (error) {
        console.error("❌ Error handling post image upload:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export { upload, router };