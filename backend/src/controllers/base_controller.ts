import { Request, Response } from "express";
import { Model } from "mongoose";

class Basecontroller <T> {
    model: Model<T>;
    constructor(model: any) {
        this.model = model;
    }
    
    async getAll (req: Request, res: Response)
    {
        const ownerFilter = req.query.owner;
        try{
            if(ownerFilter){
                const data = await this.model.find({ownerFilter});
                res.status(200).send(data);
            }else {
                const data= await this.model.find();
                res.status(200).send(data);
            }
        }catch(error){
            res.status(400).send(error);
        }
    };

    async getById (req: Request, res: Response)
    {
        const postId = req.params.id;
        try{
            const data = await this.model.findById(postId);
            if(data === null) {
                return res.status(404).send("Item not found");
            } else {
                res.status(200).send(data);
            }
        }catch(error){
            res.status(400).send(error);
        }
    }
    
    async createItem (req: Request, res: Response)
    {
        try{
            const data = await this.model.create(req.body);
            res.status(201).send(data);
        }catch(error){
            res.status(400).send(error);
        }
    };
    
    async updateItem (req: Request, res: Response)
    {
        const updatedData = req.body; 
        try {
            const data = await this.model.findByIdAndUpdate(req.params.id, updatedData, { new: true, runValidators: true });
            if (!data) {
                return res.status(404).send({ message: "Item not found" });
            }
            res.status(200).send(data);
        } catch (error) {
            res.status(400).send({ message: "Error updating item", error });
        }
    };
    
    async deleteItem (req: Request, res: Response)
    {
        try {
            await this.model.findByIdAndDelete(req.params.id);
            res.status(200).send(200);
        } catch (error) {
            res.status(400).send(error);
        }
    }
};
export default Basecontroller;