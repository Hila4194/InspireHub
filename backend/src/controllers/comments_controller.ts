import commentModel from "../models/comments_model";
import { Request, Response } from "express";
import BaseController from "./base_controller";

const commentsController = new BaseController(commentModel);

export default commentsController;