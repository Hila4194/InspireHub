import mongoose from "mongoose";
const Schema = mongoose.Schema;

export interface IComment{
    comment: String,
    author: String,
    postId: String,
}

const commentSchema = new Schema<IComment>({
    comment: {
        type: String,
        required:true,
    },
    author: {
        type: String,
        required:true,
    },
    postId: {
        type: String,
        required: true,
    }
});

const commentModel = mongoose.model<IComment>("Comments", commentSchema);

export default commentModel;