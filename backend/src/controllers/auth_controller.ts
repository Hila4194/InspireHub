import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user_model";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { AuthenticatedRequest } from "../../types";

type Payload = {
  _id: string;
};

// Registers a new user with a username, email, and password
const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : "/uploads/default-avatar.png";
    
    // Validate required fields
    if (!username || !email || !password) {
      res
        .status(400)
        .json({ message: "Username, email, and password are required" });
      return;
    }

    // Enforce username rules: Must contain both letters and numbers
    if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(username)) {
      res
        .status(400)
        .json({ message: "Username must contain both letters and numbers" });
      return;
    }

    // Check if email is already registered
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    // Hash password before storing
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

// Generates access and refresh tokens for authentication
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

// Logs in a user with a username and password
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

    const apiBaseUrl = process.env.DOMAIN_BASE?.trim().replace(/\/$/, "");

    let profilePictureUrl = "/default-avatar.png";

    if (user.profilePicture) {
      if (user.profilePicture.startsWith("/uploads/")) {
        profilePictureUrl = `${apiBaseUrl}${user.profilePicture}`;
      } else {
        profilePictureUrl = user.profilePicture;
      }
    }

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
    console.error("❌ Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
    return;
  }
};

// Refreshes the access token using a refresh token
const refresh = async (req: Request, res: Response) => {
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
  jwt.verify(
    refreshToken,
    process.env.TOKEN_SECRET,
    async (err: any, payload: any) => {
      if (err) {
        res.status(403).send("Invalid token");
        return;
      }
      // find the user by refresh token
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

// Logs out a user by removing the refresh token from their list of tokens
const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).send("Refresh token required");
    return;
  }

  // Find user by refresh token
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

// Middleware to authenticate requests using JWT
export const authMiddleware = (req: AuthenticatedRequest,res: Response,next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Access denied" });
    return;
  }

  if (!process.env.TOKEN_SECRET) {
    res.status(500).json({ message: "Server error: Token secret not set" });
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
    if (err) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }

    req.user = { id: (payload as { _id: string })._id };
    next();
  });
};


const client = new OAuth2Client();
// Handles Google OAuth login and user creation
export const googleSignin = async (req: Request,res: Response): Promise<void> => {
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
      // Generate a valid username (letters + digits)
      const safeName = (payload.name || "User").replace(/\s+/g, "");
      const randomDigits = Math.floor(Math.random() * 1000);
      const username = safeName + randomDigits;

      user = await userModel.create({
        username,
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
      username: user.username,
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