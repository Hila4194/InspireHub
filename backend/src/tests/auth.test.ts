import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import postModel from "../models/posts_model";
import {Express} from "express";
import userModel from "../models/user_model";
import testPosts from "./test_posts.json";

let app: Express;

beforeAll(async ()=>{
    app = await initApp();
    await userModel.deleteMany();
    await postModel.deleteMany();
});

afterAll((done)=>{
    mongoose.connection.close();
    done();
});

type UserInfo = {
    email: string,
    password: string,
    accessToken?: string,
    refreshToken?: string,
    _id?: string
}
const userInfo: UserInfo = {
    email: "hila4194@gmail.com",
    password: "123456"
}

describe("Auth Tests", ()=>{
    test("Auth Registration", async ()=>{
        const response = await request(app).post("/auth/register").send(userInfo);
        expect(response.statusCode).toBe(200);
    });

    test("Auth Registration fail", async ()=>{
        const response = await request(app).post("/auth/register").send(userInfo);
        expect(response.statusCode).not.toBe(200);
    });

    test("Auth Login", async ()=>{
        const response = await request(app).post("/auth/login").send(userInfo);
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        const accessToken = response.body.accessToken;
        const refreshToken = response.body.refreshToken;
        const userId = response.body._id;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        expect(userId).toBeDefined();
        userInfo.accessToken = accessToken;
        userInfo.refreshToken = refreshToken;
        userInfo._id = userId;
    });

    test("Make sure two access tokens are not the same", async ()=>{
        const response = await request(app).post("/auth/login").send({
            email: userInfo.email,
            password: userInfo.password
        });
        expect(response.body.accessToken).not.toEqual(userInfo.accessToken);
    });

    test("Get protected API", async ()=>{
        const response = await request(app).post("/posts").send({
            owner: "Invalid owner",
            title: "My First Post",
            content: "This is my first post",
        });
        expect(response.statusCode).not.toBe(201);
        const response2 = await request(app).post("/posts").set({
            authorization: "jwt " + userInfo.accessToken}).send({
            owner: "Invalid owner",
            title: "My First Post",
            content: "This is my first posttt",
        });
        expect(response2.statusCode).toBe(201);
    });

    test("Get protected API invalid token", async ()=>{
        const response = await request(app).post("/posts")
        .set({
            authorization: "jwt " + userInfo.accessToken + '1'})
        .send({
            owner: userInfo._id,
            title: "My First Post",
            content: "This is my first post",
        });
        expect(response.statusCode).not.toBe(201);
    });

    test("Refresh token", async ()=>{
        const response = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response.statusCode).toBe(200);
        const accessToken = response.body.accessToken;
        const refreshToken = response.body.refreshToken;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();
        userInfo.accessToken = accessToken;
        userInfo.refreshToken = refreshToken;
    });

    test("Logout - invalidate refresh token", async ()=>{
        const response = await request(app).post("/auth/logout").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response.statusCode).toBe(200);
        const response2 = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response2.statusCode).not.toBe(200);
    });

    test("Refresh token multiple usage", async ()=>{
        //Login - get a refresh token
        const response = await request(app).post("/auth/login").send({
            email: userInfo.email,
            password: userInfo.password
        });
        expect(response.statusCode).toBe(200);
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;

        //first time use the refresh token and get a new one
        const response2 = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response2.statusCode).toBe(200);
        const newRefreshToken = response2.body.refreshToken;

        //second time use the old refresh token andexpect to fail
        const response3 = await request(app).post("/auth/refresh").send({
            refreshToken: userInfo.refreshToken
        });
        expect(response3.statusCode).not.toBe(200);

        //try to use the new refresh token and expect to fail
        const response4 = await request(app).post("/auth/refresh").send({
            refreshToken: newRefreshToken
        });
        expect(response4.statusCode).not.toBe(200);
    });

    jest.setTimeout(10000);
  test("Token expired", async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response = await request(app).post("/posts")
      .set({ authorization: "JWT " + userInfo.accessToken })
      .send(testPosts[0]);
    expect(response.statusCode).not.toBe(201);

    const response2 = await request(app).post("/auth/refresh").send({
      refreshToken: userInfo.refreshToken,
    });
    expect(response2.statusCode).toBe(200);
    
    userInfo.accessToken = response2.body.accessToken;
    userInfo.refreshToken = response2.body.refreshToken;
    const response3 = await request(app).post("/posts")
      .set({ authorization: "JWT " + userInfo.accessToken })
      .send(testPosts[0]);
    expect(response3.statusCode).toBe(201);

  });
});