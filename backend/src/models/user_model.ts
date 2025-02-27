import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ""
    },
    refreshToken: {
        type: String,
        default: ""
    },
  },
  { timestamps: true }
);

export default mongoose.model("Users", UserSchema);