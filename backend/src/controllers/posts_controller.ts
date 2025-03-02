import postModel, { IPost } from "../models/posts_model";
import { Request, Response } from "express";
import Basecontroller from "./base_controller";

class postController extends Basecontroller<IPost>
{
    constructor(model: any){
        super(model);
    }

    async createItem (req: Request, res: Response)
    {
        const _id = req.query.userId;
        const post = {
            ...req.body,
            owner: _id
        }
        req.body = post;
        return super.createItem(req, res);
    }
}

export default new postController(postModel);