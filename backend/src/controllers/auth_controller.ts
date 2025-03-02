import { Request, Response, NextFunction } from "express";
import userModel from "../models/user_model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const register = async (req: Request, res: Response) => {
    try{
        const email = req.body.email;
        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await userModel.create({
            email: email,
            password: hashedPassword,
        });
        res.status(200).send(user);
        return
    }catch(err){
        res.status(400).send(err);
        return
    }
};

const generateTokens = (_id: string) : {accessToken: string, refreshToken: string} => {
    const random = Math.floor(Math.random() * 1000000);
    const accessToken = jwt.sign(
        {_id: _id, random: random},
        process.env.TOKEN_SECRET as string,
        {expiresIn: Number(process.env.TOKEN_EXPIRATION) || "1h"});
    const refreshToken = jwt.sign(
        {_id: _id, random: random},
        process.env.TOKEN_SECRET as string,
        {expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRATION) || "7d"});
    return {accessToken, refreshToken};
};

const login = async (req: Request, res: Response) => {
    try{
        const email = req.body.email;
        const user = await userModel.findOne({email: email});
        if(!user){
            res.status(400).send("Wrong Email or password");
            return
        }
        const password = req.body.password;
        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword){
            res.status(400).send("Wrong Email or password");
            return
        }
        if(!process.env.TOKEN_SECRET){
            res.status(400).send("Missing auth configuration");
            return
        }
        const userId = user._id.toString();
        const tokens = generateTokens(userId);
        if(!tokens){
            res.status(400).send("Missing auth configuration");
            return
        }
        if(user.refreshTokens == null){
            user.refreshTokens = [];
        }
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();
        res.status(200).send({
            email: user.email,
            _id: user._id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
        return
    }catch(err){
        res.status(400).send(err);
        return
    }};

    const logout = async (req: Request, res: Response) => {
        const refreshToken = req.body.refreshToken;
        if(!refreshToken){
            res.status(400).send("Missing refresh token");
            return
        };
        //first validate the refresh token
        if(!process.env.TOKEN_SECRET){
            res.status(400).send("Missing auth configuration");
            return
        }
        jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, data: any) => {
            if(err){
                res.status(403).send("Invalid token");
                return
            }
            const payload = data as TokenPayLoad;
            try{
                const user = await userModel.findOne({_id: payload._id});
                if(!user){
                    res.status(400).send("Invalid token");
                    return
                }
                if(!user.refreshTokens || !user.refreshTokens.includes(refreshToken)){
                    user.refreshTokens = [];
                    await user.save();
                    res.status(400).send("Invalid token");
                    return
                }
                user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
                await user.save();
                res.status(200).send("Logged out");
            }catch(err){
                res.status(400).send("Invalid token");
            }
        });
    };

    const refresh = async (req: Request, res: Response) => {
        //first validate the refresh token
        const refreshToken = req.body.refreshToken;
        if(!refreshToken){
            res.status(400).send("Invalid token");
            return
        }
        if(!process.env.TOKEN_SECRET){
            res.status(400).send("Missing auth configuration");
            return
        }
        jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, data: any) => {
            if(err){
                res.status(403).send("Invalid token");
                return
            }
            //find the user
            const payload = data as TokenPayLoad;
            try{
                const user = await userModel.findOne({_id: payload._id});
                if(!user){
                    res.status(400).send("Invalid token");
                    return
                }
                //check that the token exists in the user
                if(!user.refreshTokens || !user.refreshTokens.includes(refreshToken)){
                    user.refreshTokens = [];
                    await user.save();
                    res.status(400).send("Invalid token");
                    return
                }
                //generate new access token
                const userId = user._id.toString();
                const tokens = generateTokens(userId);
                if(!tokens){
                    user.refreshTokens = [];
                    await user.save();
                    res.status(400).send("Missing auth configuration");
                    return
                }                
                //delete the old refresh token
                user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
                //save the new refresh token in the user
                user.refreshTokens.push(tokens.refreshToken);
                await user.save();
                //return the new access token and refresh token
                res.status(200).send({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken
                });
            }catch(err){
                res.status(400).send("Invalid token");
                return
            }
        });
    };

    type TokenPayLoad = {
        _id: string;
    }
    export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if(!token){
            res.status(401).send("Unauthorized");
            return;
        }
        if(!process.env.TOKEN_SECRET){
            res.status(400).send("Missing auth configuration");
            return;
        }
        jwt.verify(token, process.env.TOKEN_SECRET, (err, data) => {
            if(err){
                res.status(403).send("Invalid token");
                return;
            }
            const payload = data as TokenPayLoad;
            req.query.userId = payload._id;
            next();
        });
    };

export default { register, login, logout, refresh };