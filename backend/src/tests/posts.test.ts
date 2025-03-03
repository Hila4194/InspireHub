import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import {Express} from "express";
import testPosts from "./test_posts.json";

let app: Express;

type UserInfo = {
    email: string,
    password: string,
    token?: string,
    _id?: string
}
const userInfo: UserInfo = {
    email: "hila4194@gmail.com",
    password: "123456"
}

let accessToken: string;
let postId = "";

beforeAll(async ()=>{
    app = await initApp();
    await postModel.deleteMany();
    const response = await request(app).post("/auth/register").send(userInfo);
    const response2 = await request(app).post("/auth/login").send(userInfo);
    expect(response2.statusCode).toBe(200);
    accessToken = response2.body.token;
    testPosts[0].owner = response2.body._id;
});

afterAll(()=>{
    mongoose.connection.close();
});

const invalidPost = {
    content: "Test content",
  };

describe("Posts Test", ()=>{
    test("Test get all posts empty", async ()=>{
        const response = await request(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
    });

    test("Test create new post", async ()=>{
        for(let post of testPosts){
            const response = await request(app).post("/posts")
            .set("authorization", "jwt " + accessToken)
            .send(post);
            expect(response.statusCode).toBe(201);
            expect(response.body.title).toBe(post.title);
            expect(response.body.content).toBe(post.content);
            postId = response.body._id;
        }
    });

    test("Test get all posts full", async ()=>{
        const response = await request(app).get("/posts");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(testPosts.length);
    });

    test("Test get post by id", async ()=>{
        const response = await request(app).get("/posts/" + postId);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(postId);
    });

    test("Test filter post by owner", async ()=>{
        const response = await request(app).get("/posts?owner=" + testPosts[0].owner);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
    });

    test("Test Delete post by id", async ()=>{
        const response = await request(app).delete("/posts/" + postId)
        .set("authorization", "jwt " + userInfo.token);
        expect(response.statusCode).toBe(200);
        
        const responseGet = await request(app).get("/posts/" + postId);
        expect(responseGet.statusCode).toBe(404);
    });

    test("Test create new post - fail", async ()=>{
        const response = await request(app).post("/posts")
        .set("authorization", "jwt " + userInfo.token)
        .send({
            title: "Test Post 1",
            content: "Test content 1"
        });
        expect(response.statusCode).not.toBe(201);
    });
});