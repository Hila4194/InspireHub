import mongoose from 'mongoose';

export interface IPost {
    title: string;
    content?: string;
    sender: string;
    imageUrl?: string;
}

const PostSchema = new mongoose.Schema<IPost>({
    title: { type: String, required: true }, 
    content: { type: String, required: function() { return !this.imageUrl; } },
    sender: { type: String, required: true }, 
    imageUrl: { type: String, default: "" },
});

const postModel = mongoose.model<IPost>('Post', PostSchema);

export default postModel;