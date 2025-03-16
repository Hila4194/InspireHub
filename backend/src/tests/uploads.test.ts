import request from "supertest";
import appPromise from "../server";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { Express } from "express";

let app: Express;

beforeAll(async () => {
    app = await appPromise();
});

afterAll(async () => {
    await mongoose.disconnect(); // Close MongoDB connection after tests
});

describe("Uploads Tests", () => {
    test("Should upload a profile picture", async () => {
        const filePath = path.join(__dirname, "test_pic.png"); // Ensure this file exists

        if (!fs.existsSync(filePath)) {
            console.error("Test image file does not exist:", filePath);
            return; // Skip test instead of failing
        }

        try {
            const response = await request(app)
                .post("/api/auth/register")
                .set("Content-Type", "multipart/form-data")
                .field("username", "testUser123")
                .field("email", "test2@user.com")
                .field("password", "testpassword")
                .attach("profilePicture", filePath);

            if (response.statusCode !== 201) {
                console.error("❌ Upload failed:", response.statusCode, response.body);
            }

            expect(response.statusCode).toEqual(201);
            expect(response.body.user.profilePicture).toMatch(/\/uploads\/.+\.(png|jpg|jpeg)$/);

            console.log("✅ Uploaded image URL:", response.body.user.profilePicture);

            const uploadedImageUrl = response.body.user.profilePicture;
            const imageUrlPath = uploadedImageUrl.replace(/^.*\/\/[^/]+/, "");

            // Ensure uploaded image is accessible
            const res = await request(app).get(imageUrlPath);
            expect(res.statusCode).toEqual(200);
        } catch (err) {
            console.error("❌ Upload test failed:", err);
            throw err;
        }
    });
});