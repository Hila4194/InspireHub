import { Request, Response } from "express";

export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded or invalid file type" });
            return;
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        console.log("✅ Profile picture uploaded:", imageUrl);

        res.json({ url: imageUrl });
    } catch (error) {
        console.error("❌ Error handling profile picture upload:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const uploadPostImage = async (req: Request, res: Response): Promise<void> => {
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
};