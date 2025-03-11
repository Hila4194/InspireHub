import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user_model";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import path from "path";
import { OAuth2Client } from "google-auth-library";
import { AuthenticatedRequest } from "../../types";

type Payload = {
  _id: string;
};

const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : "/uploads/default-avatar.png";

    if (!username || !email || !password) {
      res
        .status(400)
        .json({ message: "Username, email, and password are required" });
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(username)) {
      res
        .status(400)
        .json({ message: "Username must contain both letters and numbers" });
      return;
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser: IUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      profilePicture,
      refreshTokens: [],
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

const generateTokens = (
  _id: string
): { accessToken: string; refreshToken: string } | null => {
  const random = Math.floor(Math.random() * 1000000);

  if (!process.env.TOKEN_SECRET) {
    return null;
  }
  const accessToken = jwt.sign(
    {
      _id: _id,
      random: random,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION } as SignOptions
  );

  const refreshToken = jwt.sign(
    {
      _id: _id,
      random: random,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION } as SignOptions
  );
  return { accessToken, refreshToken };
};

const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    const user = await userModel.findOne({ username });
    if (!user) {
      res.status(400).json({ message: "Wrong username or password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ message: "Invalid password" });
      return;
    }

    const tokens = generateTokens(user._id);
    if (!tokens) {
      res.status(500).json({ message: "Error generating tokens" });
      return;
    }

    const { accessToken, refreshToken } = tokens;

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save();

    const profilePictureUrl = `${process.env.API_BASE_URL}${user.profilePicture}`;

    res.status(200).json({
      username: user.username,
      email: user.email,
      _id: user._id,
      profilePicture: profilePictureUrl,
      accessToken,
      refreshToken,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error logging in" });
    return;
  }
};

const refresh = async (req: Request, res: Response) => {
  // validate refresh token
  const { refreshToken } = req.body;
  console.log("refreshToken:", refreshToken);
  if (!refreshToken) {
    res.status(400).send("Invalid refresh token");
    return;
  }
  if (!process.env.TOKEN_SECRET) {
    res.status(400).send("Token secret not set");
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: any, payload: any) => {
      if (err) {
        res.status(403).send("Invalid token");
        return;
      }
      //  find the user by refresh token
      const userId = (payload as Payload)._id;
      try {
        const user = await userModel.findById(userId);
        if (!user) {
          res.status(404).send("Invalid token");
          return;
        }
        // check the token is in the user's refresh token list
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          res.status(400).send("Invalid refresh token");
          user.refreshTokens = [];
          await user.save();
          return;
        }
        // generate a new tokens
        const newTokens = generateTokens(user._id);
        if (!newTokens) {
          user.refreshTokens = [];
          await user.save();
          res.status(500).send("Error generating tokens");
          return;
        }

        // delete the old refresh token
        user.refreshTokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );

        // save the refresh token to the user
        user.refreshTokens.push(newTokens.refreshToken);
        await user.save();

        // return the new access token and refresh token
        res.status(200).send({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        });
        return;
      } catch (error) {
        console.error(error);
        res.status(500).send("Error refreshing token");
        return;
      }
    }
  );
};

const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).send("Refresh token required");
    return;
  }

  // Find user by refresh token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET as string,
    async (err: any, payload: any) => {
      if (err) {
        res.status(403).send("Invalid token");
        return;
      }
      const userId = (payload as Payload)._id;
      try {
        const user = await userModel.findById(userId);
        // Check if user exists
        if (!user) {
          res.status(404).send("Invalid Token");
          return;
        }
        // Check if refresh token is in user's refresh token list
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
          res.status(400).send("Invalid refresh token");
          user.refreshTokens = [];
          await user.save();
          return;
        }

        user.refreshTokens = user.refreshTokens.filter(
          (token) => token !== refreshToken
        );
        await user.save();
        res.status(200).send("Logged out");
      } catch (error) {
        console.error(error);
        res.status(500).send("Error logging out");
        return;
      }
    }
  );
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => { // ✅ Explicitly set return type to `void`
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return; // ✅ Ensure function exits after sending response
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).json({ message: "Server error: Token secret not set" });
    return; // ✅ Ensure function exits after sending response
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) {
      res.status(403).json({ message: "Invalid token" });
      return; // ✅ Ensure function exits after sending response
    }

    req.user = { id: (payload as { _id: string })._id }; // ✅ Attach user to req.user
    next();
  });
};

const client = new OAuth2Client();
export const googleSignin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: "Invalid Google token" });
      return;
    }

    const email = payload.email;
    if (!email) {
      res.status(400).json({ message: "Email not found in Google token" });
      return;
    }

    let user = await userModel.findOne({ email });
    if (!user) {
      // ✅ Generate a valid username (letters + digits)
      const safeName = (payload.name || "User").replace(/\s+/g, "");
      const randomDigits = Math.floor(Math.random() * 1000);
      const username = safeName + randomDigits; // Example: "JohnDoe123"

      user = await userModel.create({
        username, // ✅ Fixes missing username issue
        email,
        password: "", // No password needed for Google users
        profilePicture: payload.picture,
      });
    }

    const tokens = generateTokens(user._id);
    if (!tokens) {
      res.status(500).json({ message: "Token generation failed" });
      return;
    }

    res.status(200).json({
      email: user.email,
      _id: user._id,
      profilePicture: user.profilePicture,
      ...tokens,
    });
  } catch (err) {
    console.error("Google Signin Error:", err);
    res.status(400).json({
      message: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
};

export default { register, login, refresh, logout, googleSignin };