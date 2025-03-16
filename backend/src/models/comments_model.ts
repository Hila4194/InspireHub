import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
    content: string;
    sender: mongoose.Types.ObjectId;
    postId: mongoose.Types.ObjectId;
}

const CommentSchema = new Schema<IComment>({
    content: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true }
});

export default mongoose.model<IComment>("Comment", CommentSchema);