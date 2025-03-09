import { Request, Response } from "express";
import userModel from "../models/user_model";

// ✅ Update Profile Function
const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const { username, email } = req.body;
        let profilePicture = undefined;

        // ✅ If a new profile picture is uploaded, set the file path
        if (req.file) {
            profilePicture = `/uploads/${req.file.filename}`;
        }

        // ✅ Update user details
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { username, email, ...(profilePicture && { profilePicture }) }, // Only update profilePicture if provided
            { new: true }
        );

        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

export default { updateProfile };