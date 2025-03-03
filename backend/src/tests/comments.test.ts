import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import commentModel from "../models/comments_model";
import {Express} from "express";
import testComments from "./test_comments.json";

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

beforeAll(async ()=>{
    app = await initApp();
    await commentModel.deleteMany();
    await request(app).post("/auth/register").send(userInfo);
    const response = await request(app).post("/auth/login").send(userInfo);
    userInfo.token = response.body.token;
    userInfo._id = response.body._id;
    expect(response.statusCode).toBe(200);
});

afterAll(()=>{
    mongoose.connection.close();
});

let commentId = "";

describe("Comments Test", ()=>{
    test("Test get all comments empty", async ()=>{
        const response = await request(app).get("/comments");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(0);
    });

    test("Test create new comment", async ()=>{
        for(let comment of testComments){
            const response = await request(app).post("/comments")
            .set("authorization", "JWT " + userInfo.token)
            .send(comment);
            expect(response.statusCode).toBe(201);
            expect(response.body.comment).toBe(comment.comment);
            expect(response.body.postId).toBe(comment.postId);
            commentId = response.body._id;
        }
    });

    test("Test get all comments full", async ()=>{
        const response = await request(app).get("/comments");
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(testComments.length);
    });

    test("Test get comment by id", async ()=>{
        const response = await request(app).get("/comments/" + commentId);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(commentId);
    });

    test("Test filter comment by author", async ()=>{
        const response = await request(app).get("/comments?author=" + testComments[0].author);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(2);
    });

    test("Test Delete comment by id", async ()=>{
        const response = await request(app).delete("/comments/" + commentId)
        .set("authorization", "JWT " + userInfo.token);
        expect(response.statusCode).toBe(200);
        
        const responseGet = await request(app).get("/comments/" + commentId);
        expect(responseGet.statusCode).toBe(404);
    });

    test("Test create new comment - fail", async ()=>{
        const response = await request(app).post("/comments")
        .set("authorization", "JWT " + userInfo.token)
        .send({
            comment: "Test Comment 1",
            author: "Hila"
        });
        expect(response.statusCode).toBe(400);
    });
});