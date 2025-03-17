import request from "supertest";
import appPromise from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import testPosts from "./test_posts.json";
import userModel, { IUser } from "../models/user_model";
import { Express } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ Import AI module

let app: Express;
let postId: string;

type User = IUser & { accessToken?: string, refreshToken?: string };

const testUser: User = {
    username: "testUser1",
    email: "test@user.com",
    password: "testpassword",
    profilePicture: "default-avatar.png"
};

beforeAll(async () => {
    console.log("This runs before all tests");
    app = await appPromise();
    await postModel.deleteMany();
    await userModel.deleteMany();
  
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });
  
    testUser.accessToken = res.body.accessToken;
    testUser.refreshToken = res.body.refreshToken;
    testUser._id = res.body._id;
    console.log("Test user created with token:", testUser);
    expect(testUser.accessToken).toBeDefined();
    expect(testUser.refreshToken).toBeDefined();
});

afterAll(async () => {
    console.log('This runs after all tests');
    await mongoose.disconnect(); // Close MongoDB connection after tests
});

describe("Create Post", () => {
    test("should create a new post with content", async () => {
        const res = await request(app)
            .post("/api/posts")
            .set({ authorization: "JWT " + testUser.accessToken })
            .send({
                title: testPosts[0].title,
                content: testPosts[0].content,
                sender: testUser._id,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.sender).toEqual(testUser._id);

        postId = res.body._id;
    });

    test("should create a new post with imageUrl instead of content", async () => {
        const res = await request(app)
            .post("/api/posts")
            .set({ authorization: "JWT " + testUser.accessToken })
            .send({
                title: "Image Post",
                imageUrl: "http://example.com/image.jpg",
                sender: testUser._id,
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.imageUrl).toEqual("http://example.com/image.jpg");
    });

    test("should return 400 if neither content nor imageUrl is provided", async () => {
        const res = await request(app)
            .post("/api/posts")
            .set({ authorization: "JWT " + testUser.accessToken })
            .send({
                title: "Invalid Post",
                sender: testUser._id,
            });

        expect(res.statusCode).toEqual(400);
    });
  });

describe("Get Posts", () => {
    test("should get all posts", async () => {
        const res = await request(app).get("/api/posts");
    
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0);
    
        const createdPost = res.body.find((p: any) => p.title === testPosts[0].title);
        expect(createdPost).toBeDefined();
        expect(createdPost.content).toEqual(testPosts[0].content);
    });    

    test("should return 500 if there is a server error", async () => {
        // Correctly mock a Mongoose Query error
        jest.spyOn(postModel, "find").mockImplementationOnce(() => {
            return {
                exec: jest.fn().mockRejectedValue(new Error("Database error")), // Mock exec() rejection
            } as any;
        });
    
        const res = await request(app).get("/api/posts");
        
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty("message", "Error fetching posts");
    
        // Restore original implementation
        jest.restoreAllMocks();
    });    
});

describe("Get Post by ID", () => {
    test("should get a post by id", async () => {
        
        const res = await request(app).get(`/api/posts/${postId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.title).toEqual(testPosts[0].title);
        expect(res.body.content).toEqual(testPosts[0].content);
        expect(res.body.sender).toEqual(testUser._id);

    });

    // Test for 404 error when the post is not found
    test("should return 404 if the post does not exist", async () => {
        const fakeId = "000000000000000000000000"; // A non-existent ID
        const res = await request(app).get(`/api/posts/${fakeId}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty("message", "not found");
    });

    test("should return 500 if there is a server error", async () => {
        // Mock Post.findById to throw an error
        jest.spyOn(postModel, 'findById').mockImplementationOnce(() => {
            throw new Error("Database error");
        });

        const res = await request(app).get(`/api/posts/${postId}`);
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty("error", "Database error");

        // Restore the original implementation
        jest.restoreAllMocks();
    });
});

describe("Get Posts by Sender", () => { 
    test("should get posts by sender", async () => {
        const res = await request(app)
            .get(`/api/posts/user/${testUser._id}`) // Ensure correct route structure
            .set({
                authorization: "JWT " + testUser.accessToken,
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBeGreaterThan(0); // Ensures posts exist
        expect(res.body[0]).toHaveProperty("_id");
        expect(res.body[0]).toHaveProperty("sender"); // Ensures sender field exists
    });    

    test("should return 500 if there is a server error", async () => {
        // Correctly mock a Mongoose Query error
        jest.spyOn(postModel, "find").mockImplementationOnce(() => {
            return {
                exec: jest.fn().mockRejectedValue(new Error("Database error")), // Simulate rejection
            } as any;
        });
    
        const res = await request(app)
            .get(`/api/posts/user/${testPosts[0].sender}`)
            .set({ authorization: "JWT " + testUser.accessToken });
        
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty("message", "Internal server error.");
    
        // Restore original implementation
        jest.restoreAllMocks();
    });    
});

describe("Like/Unlike Post Edge Cases", () => {
    test("should return 401 if user is not logged in", async () => {
        const res = await request(app)
            .put(`/api/posts/${postId}/like`);

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("message", "Access denied");
    });

    test("should not like a post multiple times from the same user", async () => {
        expect(postId).toBeDefined();

        // Ensure the post exists before liking
        const checkPost = await postModel.findById(postId);
        expect(checkPost).not.toBeNull();

        // Like the post once
        await request(app)
            .put(`/api/posts/${postId}/like`)
            .set({ authorization: "Bearer " + testUser.accessToken });

        // Attempt to like the same post again
        const res = await request(app)
            .put(`/api/posts/${postId}/like`)
            .set({ authorization: "Bearer " + testUser.accessToken });

        expect(res.statusCode).toEqual(200);
        expect(res.body.liked).toBe(false); // Should not allow multiple likes
    });

    test("should handle unliking a post properly", async () => {
        expect(postId).toBeDefined();
    
        // Ensure the post exists before unliking
        const checkPost = await postModel.findById(postId);
        expect(checkPost).not.toBeNull();
    
        // First, Like the post
        await request(app)
            .put(`/api/posts/${postId}/like`)
            .set({ authorization: "Bearer " + testUser.accessToken });
    
        // Then, Unlike the post
        const res = await request(app)
            .put(`/api/posts/${postId}/like`)
            .set({ authorization: "Bearer " + testUser.accessToken });
    
        expect(res.statusCode).toEqual(200);
        expect(res.body.likes).toBeDefined();
        expect(res.body.likes).toBeGreaterThanOrEqual(0);
        
        expect(res.body.liked).toBe(false);
    });    
});

describe("Get Posts with Pagination & Sorting", () => {
    test("should retrieve posts with pagination (limit, skip)", async () => {
        const res = await request(app)
            .get("/api/posts?limit=1&skip=0");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeLessThanOrEqual(1);
    });

    test("should sort posts by createdAt in descending order", async () => {
        const res = await request(app).get("/api/posts");

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        if (res.body.length > 1) {
            const timestamps: number[] = res.body.map((post: { createdAt: string }) => new Date(post.createdAt).getTime());
            expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a)); // Ensures correct sorting
        }
    });
});

describe("AI Post Suggestions - Error Handling", () => {
    beforeEach(() => {
        jest.restoreAllMocks(); // Reset mocks before each test
    });

    test("should return 500 if AI service fails", async () => {
        // Mock AI API to throw an error
        jest.spyOn(GoogleGenerativeAI.prototype, "getGenerativeModel").mockImplementation(() => {
            return {
                generateContent: async () => {
                    throw new Error("AI service unavailable");
                },
            } as any;
        });

        const res = await request(app)
            .post("/api/posts/suggestions")
            .send({ userInput: "Technology trends" });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty("message", "Failed to generate post suggestions using Gemini.");
    }, 10000); // Increased timeout to 10s
});

const updatedPost = {
    title: "Updated Post",
    content: "This is an updated post",
    sender: "Updated Sender",
};

describe("Update Post", () => {
    test("should update a post", async () => {
        const res = await request(app)
            .put(`/api/posts/${postId}`)
            .set({ authorization: "JWT " + testUser.accessToken })
            .send(updatedPost);

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toEqual(updatedPost.title);
        expect(res.body.content).toEqual(updatedPost.content);
    });

    test("should return 404 if the post does not exist", async () => {
        const fakeId = "000000000000000000000000";
        const res = await request(app)
            .put(`/api/posts/${fakeId}`)
            .set({ authorization: "JWT " + testUser.accessToken })
            .send(updatedPost);

        expect(res.statusCode).toEqual(404);
    });

    test("should return 500 if there is a server error", async () => {
        jest.spyOn(postModel, "findByIdAndUpdate").mockImplementationOnce(() => {
            throw new Error("Failed to update post");
        });
    
        const res = await request(app)
            .put(`/api/posts/${postId}`)
            .set({ authorization: "JWT " + testUser.accessToken })
            .send(updatedPost);
    
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty("message", "Failed to update post");
    
        jest.restoreAllMocks(); // Ensure we clean up the mock
    });    
});

describe("Delete Post", () => {
    test("should delete all created posts", async () => {
        // Fetch all posts before deletion
        const getPostsRes = await request(app).get("/api/posts");
        expect(getPostsRes.statusCode).toEqual(200);

        const allPosts = getPostsRes.body;
        expect(allPosts.length).toBeGreaterThan(0); // Ensure there are posts to delete

        // Delete each post individually
        for (const post of allPosts) {
            const deleteRes = await request(app)
                .delete(`/api/posts/${post._id}`)
                .set({ authorization: "JWT " + testUser.accessToken });

            expect(deleteRes.statusCode).toEqual(200);
        }

        // Fetch posts again to ensure they are all deleted
        const checkRes = await request(app).get("/api/posts");
        expect(checkRes.statusCode).toEqual(200);
        expect(checkRes.body.length).toEqual(0); // Ensure all posts are deleted
    });

    test("should return 404 if post does not exist", async () => {
        const fakeId = "000000000000000000000000";
        const res = await request(app)
            .delete(`/api/posts/${fakeId}`)
            .set({ authorization: "JWT " + testUser.accessToken });

        expect(res.statusCode).toEqual(404);
    });
});
  
  describe("Get Posts", () => {
    test("should return empty posts after deletion", async () => {
        const res = await request(app).get("/api/posts");
    
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });    
  });