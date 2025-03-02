import commentModel, { IComment } from "../models/comments_model";
import Basecontroller from "./base_controller";

const commentController = new Basecontroller<IComment>(commentModel);

export default commentController;