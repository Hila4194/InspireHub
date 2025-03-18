import mongoose, { Schema, Document } from "mongoose";

// Interface representing a Comment document in MongoDB
export interface IComment extends Document {
    content: string;
    sender: mongoose.Types.ObjectId;
    postId: mongoose.Types.ObjectId;
}

// Mongoose schema defining the structure of a Comment document
const CommentSchema = new Schema<IComment>({
    content: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true }
});

export default mongoose.model<IComment>("Comment", CommentSchema);