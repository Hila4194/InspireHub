import { Request, Response } from "express";
import userModel from "../models/user_model";

// Updates a user's profile, including their username and profile picture
const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const { username } = req.body;
        let profilePicture: string | undefined;

        if (req.file) {
            profilePicture = `/uploads/${req.file.filename}`;
        }

        if (username && !/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(username)) {
            res.status(400).json({ message: "Username must contain both letters and numbers" });
            return;
        }

        const updateFields: { username?: string; profilePicture?: string } = {};
        if (username) updateFields.username = username;
        if (profilePicture) updateFields.profilePicture = profilePicture;

        const updatedUser = await userModel.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        updatedUser.profilePicture = updatedUser.profilePicture
            ? `${process.env.DOMAIN_BASE}${updatedUser.profilePicture}`
            : undefined;

        res.json(updatedUser);
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

export default { updateProfile };