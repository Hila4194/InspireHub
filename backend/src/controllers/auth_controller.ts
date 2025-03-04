import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user_model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";

const register = async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let imgUrl = req.body.imgUrl;
    if (!imgUrl) imgUrl = null;
    const user = await userModel.create({
      email: req.body.email,
      password: hashedPassword,
      imgUrl: imgUrl,
    });
    res.status(200).send(user);
  } catch (err) {
    res.status(400).send(err);
  }
};

const generateTokens = (user: IUser): { refreshToken: string, accessToken: string } | null => {
  if (process.env.TOKEN_SECRET === undefined) {
    return null;
  }
  const rand = Math.random();
  const accessToken = jwt.sign(
    {
      _id: user._id,
      rand: rand
    },
    process.env.TOKEN_SECRET,
    { expiresIn: Number(process.env.TOKEN_EXPIRATION) || "30m" });
  const refreshToken = jwt.sign(
    {
      _id: user._id,
      rand: rand
    },
    process.env.TOKEN_SECRET,
    { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRATION) || "7d" });
  return { refreshToken: refreshToken, accessToken: accessToken };
};

const login = async (req: Request, res: Response) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) {
      res.status(400).send("incorrect email or password");
      return;
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).send("incorrect email or password");
      return;
    }
    const tokens = generateTokens(user);
    if (!tokens) {
      res.status(400).send("error");
      return;
    }
    if (user.refreshTokens == undefined) {
      user.refreshTokens = [];
    }
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(200).send(
      {
        ...tokens,
        _id: user._id
      });
  } catch (err) {
    res.status(400).send(err);
  }
};

const validateRefreshToken = (refreshToken: string | undefined) => {
  return new Promise<Document<unknown, {}, IUser> & IUser>((resolve, reject) => {
    if (refreshToken == null) {
      reject("error");
      return;
    }
    if (!process.env.TOKEN_SECRET) {
      reject("error");
      return;
    }
    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, payload: any) => {
      if (err) {
        reject(err);
        return;
      }
      const userId = (payload as Payload)._id;
      try {
        const user = await userModel.findById(userId);
        if (!user) {
          reject("error");
          return;
        }
        //check if token exists
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          user.refreshTokens = [];
          await user.save();
          reject(err);
          return;
        }
        resolve(user);
      } catch (err) {
        reject(err);
      }
    });
  });
};

const logout = async (req: Request, res: Response) => {
  try {
    const user = await validateRefreshToken(req.body.refreshToken);
    if (!user) {
      res.status(400).send("error");
      return;
    }
    //remove the token from the user
    user.refreshTokens = user.refreshTokens!.filter((token) => token !== req.body.refreshToken);
    await user.save();
    res.status(200).send("logged out");
  } catch (err) {
    res.status(400).send("error");
    return;
  }
};

const refresh = async (req: Request, res: Response) => {
  try {
    const user = await validateRefreshToken(req.body.refreshToken);

    const tokens = generateTokens(user);
    if (!tokens) {
      res.status(400).send("error");
      return;
    }
    user.refreshTokens = user.refreshTokens!.filter((token) => token !== req.body.refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    res.status(200).send({
      ...tokens,
      _id: user._id
    });
  } catch (err) {
    res.status(400).send("error");
  }
};

type Payload = {
  _id: string;
}
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const tokenHeader = req.headers["authorization"];
  const token = tokenHeader && tokenHeader.split(" ")[1];

  if (!token) {
    res.status(401).send("Access denied: No token provided");
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).send("Server error: Token secret is missing");
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        res.status(401).send("Token expired");
      } else {
        res.status(403).send("Access denied: Invalid token");
      }
      return;
    }

    // Ensure TypeScript recognizes the payload type
    if (typeof payload !== "object" || payload === null || !("_id" in payload)) {
      res.status(403).send("Access denied: Invalid token structure");
      return;
    }

    req.params.userId = (payload as { _id: string })._id;
    next();
  });
};

export default {register, login, refresh, logout}