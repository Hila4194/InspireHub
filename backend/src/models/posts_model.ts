import mongoose from 'mongoose';

// Interface representing a Post document in MongoDB
export interface IPost {
    title: string;
    content?: string;
    sender: mongoose.Schema.Types.ObjectId;
    imageUrl?: string;
    likes: mongoose.Types.ObjectId[];
    comments: mongoose.Types.ObjectId[];
}

// Mongoose schema defining the structure of a Post document
const PostSchema = new mongoose.Schema<IPost>({
    title: { type: String, required: true }, 
    content: { type: String, required: function() { return !this.imageUrl; } },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    imageUrl: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
}, { timestamps: true });

const postModel = mongoose.model<IPost>('Post', PostSchema);

export default postModel;