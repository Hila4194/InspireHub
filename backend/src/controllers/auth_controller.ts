import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/user_model";

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const accessToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.json({ accessToken, refreshToken, user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Login a user
export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ message: "No refresh token provided" });
        return;
      }
  
      const user = await User.findOne({ refreshToken });
      if (!user) {
        res.status(400).json({ message: "Invalid refresh token" });
        return;
      }
  
      // Clear the refresh token from the database
      user.refreshToken = "";
      await user.save();
  
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };