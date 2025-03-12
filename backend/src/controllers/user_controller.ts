import { Request, Response } from "express";
import userModel from "../models/user_model";

// ✅ Update Profile Function
const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const { username, email } = req.body;
        let profilePicture = undefined;

        console.log("📌 Incoming Profile Update:", req.body);
        console.log("📌 Incoming File:", req.file ? req.file.filename : "No file uploaded");

        // ✅ If a new profile picture is uploaded, store the correct file path
        if (req.file) {
            profilePicture = `/uploads/${req.file.filename}`;
        }

        // ✅ Update user details in MongoDB
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { username, email, ...(profilePicture && { profilePicture }) }, // Only update profilePicture if provided
            { new: true }
        );

        if (!updatedUser) {
            console.error("❌ User not found:", userId);
            res.status(404).json({ message: "User not found" });
            return;
        }

        const profilePictureUrl = updatedUser.profilePicture && updatedUser.profilePicture.startsWith("/uploads/")
            ? `${process.env.API_BASE_URL}${updatedUser.profilePicture}`
            : updatedUser?.profilePicture;

        res.json({ ...updatedUser.toObject(), profilePicture: profilePictureUrl });
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

export default { updateProfile };