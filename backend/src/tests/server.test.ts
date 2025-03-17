import request from "supertest";
import appPromise from "../server";
import mongoose from "mongoose";

let app: any;

beforeAll(async () => {
    app = await appPromise();
});

afterAll(async () => {
    console.log('This runs after all tests');
    await mongoose.disconnect(); // Close MongoDB connection after tests
});

describe("Server Initialization", () => {
    test("should start the server and respond to API requests", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(404); // Assuming root route isn't defined
    });

    test("should return 404 for unknown routes", async () => {
        const res = await request(app).get("/invalid-route");
        expect(res.statusCode).toBe(404);
    });

    test("should handle missing DATABASE_URL gracefully", async () => {
        const originalEnv = { ...process.env };
        delete process.env.DATABASE_URL; // Remove DATABASE_URL

        await expect(appPromise()).rejects.toThrow("DATABASE_URL is not set"); // ✅ Now matches `server.ts`

        process.env = originalEnv; // Restore original environment variables
    });
});