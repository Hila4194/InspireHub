jest.setTimeout(10000); // 10 seconds timeout for this file

import request from "supertest";
import appPromise from "../server";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { Express } from "express";

let app: Express;
let accessToken: string;

beforeAll(async () => {
    app = await appPromise();

    // Register a test user to get access token for uploads
    await request(app).post("/api/auth/register").send({
        username: "uploadTester1",
        email: "upload@test.com",
        password: "testpassword",
    });

    const res = await request(app).post("/api/auth/login").send({
        username: "uploadTester1",
        password: "testpassword",
    });

    accessToken = res.body.accessToken;
});

afterAll(async () => {
    await mongoose.disconnect(); // Close MongoDB connection after tests
});

describe("Uploads Tests", () => {
    const filePath = path.join(__dirname, "test_pic.png"); // Ensure this file exists

    test("Should upload a profile picture", async () => {
        const response = await request(app)
            .post("/api/uploads/profile-picture")
            .set({ Authorization: "Bearer " + accessToken })
            .attach("file", filePath);

        expect(response.statusCode).toEqual(200);
        expect(response.body.url).toMatch(/\/uploads\/.+\.(png|jpg|jpeg)$/);

        console.log("✅ Uploaded profile picture URL:", response.body.url);
    });

    test("Should upload a post image", async () => {
        const response = await request(app)
            .post("/api/uploads/post-image")
            .set({ Authorization: "Bearer " + accessToken })
            .attach("file", filePath);

        expect(response.statusCode).toEqual(200);
        expect(response.body.url).toMatch(/\/uploads\/.+\.(png|jpg|jpeg)$/);

        console.log("✅ Uploaded post image URL:", response.body.url);
    });

    test("Should return 400 if no file is uploaded (profile picture)", async () => {
        const response = await request(app)
            .post("/api/uploads/profile-picture")
            .set({ Authorization: "Bearer " + accessToken });

        expect(response.statusCode).toEqual(400);
        expect(response.body).toHaveProperty("message", "No file uploaded or invalid file type");
    });

    test("Should return 400 if no file is uploaded (post image)", async () => {
        const response = await request(app)
            .post("/api/uploads/post-image")
            .set({ Authorization: "Bearer " + accessToken });

        expect(response.statusCode).toEqual(400);
        expect(response.body).toHaveProperty("message", "No file uploaded or invalid file type");
    });
});