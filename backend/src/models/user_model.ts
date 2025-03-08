import mongoose from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  profilePicture?: string;
  _id?: string;
  refreshTokens?: string[];
}

const userSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    match: [/^(?=.*[a-zA-Z])(?=.*\d).+$/, "Username must contain both letters and numbers"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
  },
  password: {
    type: String,
    required: true,
    minlength: [6, "Password must be at least 6 characters long"],
  },
  profilePicture: {
    type: String,
    default: "/uploads/default-avatar.png",
  },
  refreshTokens: {
    type: [String],
    default: [],
  },
});

const userModel = mongoose.model<IUser>("User", userSchema);

export default userModel;