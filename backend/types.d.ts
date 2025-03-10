import { Request } from "express";

export interface AuthenticatedRequest extends Request {
    user?: { id: string }; // ✅ Extend Request type to include user
}