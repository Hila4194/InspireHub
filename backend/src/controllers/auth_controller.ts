import { Request, Response, NextFunction } from 'express';
import userModel, { IUser } from '../models/user_model';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';

type Payload = {
    _id: string;
};

const register = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : "/uploads/default-avatar.png";

    if (!username || !email || !password) {
        res.status(400).json({ message: 'Username, email, and password are required' });
        return;
    }

    // Validate username (must contain letters and numbers)
    if (!/^(?=.*[a-zA-Z])(?=.*\d).+$/.test(username)) {
        res.status(400).json({ message: "Username must contain both letters and numbers" });
        return;
    }

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Email already in use" });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser: IUser = await userModel.create({ 
            username,
            email, 
            password: hashedPassword,
            profilePicture,
            refreshTokens: []
        });

        res.status(201).json({ message: "User registered successfully", user: newUser });
        return;

    } catch (error) {  
        console.error(error);
        res.status(500).json({ message: "Error registering user" });
        return;
    }
};

const generateTokens = (_id:string): {accessToken:string, refreshToken:string} | null => {
    const random = Math.floor(Math.random() * 1000000);

    if (!process.env.TOKEN_SECRET) {
        return null;
    }
    const accessToken = jwt.sign(
        { 
            _id: _id,
            random: random
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION } as  SignOptions
    );
    
    const refreshToken = jwt.sign(
        { 
            _id: _id,
            random: random
         },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION } as  SignOptions
    );
    return { accessToken, refreshToken };
};

const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
    }

    try {
        const user = await userModel.findOne({ username });
        if (!user) {
            res.status(400).json({ message: 'Wrong username or password' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ message: 'Invalid password' });
            return;
        }

        const tokens = generateTokens(user._id);
        if (!tokens) {
            res.status(500).json({ message: 'Error generating tokens' });
            return;
        }

        const { accessToken, refreshToken } = tokens;

        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.status(200).json({
            username: user.username,
            email: user.email,
            _id: user._id,
            profilePicture: user.profilePicture,
            accessToken,
            refreshToken
        });
        return;

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
        return;
    }
};

const refresh = async (req: Request, res: Response) => {
    // validate refresh token
    const { refreshToken } = req.body;
    console.log('refreshToken:', refreshToken);
    if (!refreshToken) {
        res.status(400).send('Invalid refresh token');
        return;
    }
    if (!process.env.TOKEN_SECRET) {
        res.status(400).send('Token secret not set');
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: any, payload: any) => {
        if (err) {
            res.status(403).send('Invalid token');
            return;
        }
        //  find the user by refresh token
        const userId = (payload as Payload)._id;
        try {
            const user = await userModel.findById(userId);
            if (!user) {
                res.status(404).send('Invalid token');
                return;
            }
        // check the token is in the user's refresh token list
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
            res.status(400).send('Invalid refresh token');
            user.refreshTokens = [];
            await user.save();
            return;
        }
        // generate a new tokens
        const newTokens = generateTokens(user._id);
        if (!newTokens) {
            user.refreshTokens = [];
            await user.save();
            res.status(500).send('Error generating tokens');
            return;
        }

        // delete the old refresh token
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);

        // save the refresh token to the user
        user.refreshTokens.push(newTokens.refreshToken);
        await user.save();

        // return the new access token and refresh token
        res.status(200).send({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken
        });
        return;
        } catch (error) {
            console.error(error);
            res.status(500).send('Error refreshing token');
            return;
        }
    });
};

const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).send('Refresh token required');
        return;
    }

    // Find user by refresh token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt.verify(refreshToken, process.env.TOKEN_SECRET as string, async (err: any, payload: any) => {
        if (err) {
            res.status(403).send('Invalid token');
            return;
        }
        const userId = (payload as Payload)._id;
        try {
        const user = await userModel.findById(userId);
        // Check if user exists
        if (!user) {
            res.status(404).send('Invalid Token');
            return;
        }
        // Check if refresh token is in user's refresh token list
        if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
            res.status(400).send('Invalid refresh token');
            user.refreshTokens = [];
            await user.save();
            return;
        }
        
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        await user.save();
        res.status(200).send('Logged out');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging out');
        return;
    }
    });
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).send('Access denied');
        return;
    }
    if (!process.env.TOKEN_SECRET) {
        res.status(400).send('Token secret not set');
        return;
    }
    jwt.verify(token, process.env.TOKEN_SECRET, (err, payload) => {
        if (err) {
            res.status(403).send('Invalid token');
            return;
        }
        req.params.userId = (payload as Payload)._id;
        next();
    });
};

export default { register, login, refresh, logout };