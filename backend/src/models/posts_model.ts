import mongoose from 'mongoose';

export interface IPost {
    title: string;
    content: string;
    sender: string;
}

const PostSchema = new mongoose.Schema<IPost>({
    title: {
        type: String,
        required: true
    }, 
    content: {
        type: String,
        required: true
    }, 
    sender: {
        type: String,
        required: true
    }, 
});

const postModel = mongoose.model<IPost>('Post', PostSchema);

export default postModel;