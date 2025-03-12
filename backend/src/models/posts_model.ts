import mongoose from 'mongoose';

export interface IPost {
    title: string;
    content?: string;
    sender: mongoose.Schema.Types.ObjectId;
    imageUrl?: string;
    likes: mongoose.Types.ObjectId[];
}

const PostSchema = new mongoose.Schema<IPost>({
    title: { type: String, required: true }, 
    content: { type: String, required: function() { return !this.imageUrl; } },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

const postModel = mongoose.model<IPost>('Post', PostSchema);

export default postModel;