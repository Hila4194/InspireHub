import { Request, Response } from 'express';
import { Model } from "mongoose";

class BaseController<T> {
    model: Model<T>;
    constructor(model: Model<T>) {
        if (!model) throw new Error("Model is undefined! Check the import.");
        this.model = model;
    }

    async create(req: Request, res: Response) {
        const body = req.body;
        console.log(body);
        try {
            console.log("Creating item with data:", body);
            const item = await this.model.create(body);
            res.status(201).send(item);
        } catch (err) {
            console.error("Database error:", err); 
            res.status(500).json({ error: (err as Error).message });
        }
    };

    async getAll(req: Request, res: Response, filterKey?: string) {
        try {
            let query = {}; 
    
            if (filterKey && req.params[filterKey]) {
                query = { [filterKey]: req.params[filterKey] };
            }
    
            const items = await this.model.find(query).populate("sender", "username");
    
            if (!items.length) {
                return res.status(404).json({ message: "No posts found." });
            }
    
            res.json(items);
        } catch (err) {
            console.error("❌ Error fetching posts:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }    

    async getById (req: Request, res: Response): Promise<void> {
        const id = req.params.id;
        try {
            const item = await this.model.findById(id);
            if (item != null) {
                res.send(item);
            } else {
                res.status(404).json({ message: 'not found' });
            }
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    };
    
    async update(req: Request, res: Response): Promise<void> {
        try {
            console.log("📌 Updating Post with ID:", req.params.id);
            console.log("📌 Update Data:", req.body);
    
            const allowedUpdates = ["title", "content", "imageUrl"];
            const updateData: Record<string, any> = {};
    
            for (const key of allowedUpdates) {
                if (req.body[key] !== undefined) {
                    updateData[key] = req.body[key];
                }
            }
    
            const updatedItem = await this.model.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
            if (!updatedItem) {
                res.status(404).json({ message: "Post not found" });
                return;
            }
    
            console.log("✅ Post Updated Successfully:", updatedItem);
            res.json(updatedItem);
        } catch (err) {
            console.error("❌ Error updating post:", err);
            res.status(500).json({ message: "Failed to update post" });
        }
    }    

    async delete (req: Request, res: Response): Promise<void> {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                res.status(404).json({ message: 'not found' });
                return;
            }
            await item.deleteOne();
            res.json({ message: 'deleted' });
        } catch (err) {
            res.status(500).json({ error: (err as Error).message });
        }
    };
}

export default BaseController;