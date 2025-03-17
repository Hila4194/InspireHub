import request from "supertest";
import appPromise from "../server";
import mongoose from "mongoose";
import userModel, { IUser } from "../models/user_model";
import { Express } from "express";

let app: Express;
let userId: string;

type User = IUser & { accessToken?: string };

const testUser: User = {
    username: "TestUser123",
    email: "testuser@example.com",
    password: "testpassword",
};

beforeAll(async () => {
    console.log("📌 Setting up test environment...");
    app = await appPromise();
    await userModel.deleteMany(); // Ensure clean state

    // ✅ Register a new test user
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/login").send({
        username: testUser.username,
        password: testUser.password,
    });

    testUser.accessToken = res.body.accessToken;
    testUser._id = res.body._id;
    userId = res.body._id;

    console.log("✅ Test user created:", testUser);
});

afterAll(async () => {
    console.log("📌 Cleaning up...");
    await mongoose.disconnect(); // Close connection after tests
});

describe("User Tests", () => {
    test("Should update username", async () => {
        const res = await request(app)
            .put(`/api/auth/update-profile/${userId}`)
            .set({ authorization: "Bearer " + testUser.accessToken })
            .send({ username: "UpdatedUsername456" });

        expect(res.statusCode).toEqual(200);
        expect(res.body.username).toEqual("UpdatedUsername456");
    });

    test("Should update profile picture", async () => {
        const res = await request(app)
            .put(`/api/auth/update-profile/${userId}`)
            .set({ authorization: "Bearer " + testUser.accessToken })
            .attach("profilePicture", Buffer.from("test"), "test-image.jpg");

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("profilePicture");
        expect(typeof res.body.profilePicture).toBe("string");
        expect(res.body.profilePicture).toContain("/uploads/");
    });

    test("Should return 401 if unauthorized", async () => {
        const res = await request(app)
            .put(`/api/auth/update-profile/${userId}`)
            .send({ username: "UnauthorizedUpdate" });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty("message", "Access denied");
    });

    test("Should return 400 if user not found", async () => {
        const fakeId = "000000000000000000000000"; // Fake ID
        const res = await request(app)
            .put(`/api/auth/update-profile/${fakeId}`)
            .set({ authorization: "Bearer " + testUser.accessToken })
            .send({ username: "NonExistentUser" });
    
        expect(res.statusCode).toEqual(400); // ✅ Match the actual response
        expect(res.body).toHaveProperty("message", "Username must contain both letters and numbers");
    });    

    test("Should return 400 for invalid username format", async () => {
        const res = await request(app)
            .put(`/api/auth/update-profile/${userId}`)
            .set({ authorization: "Bearer " + testUser.accessToken })
            .send({ username: "NoNumbersOnlyLetters" }); // Fails validation

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty("message", "Username must contain both letters and numbers");
    });
});