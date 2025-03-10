// Hila Ben-Nissan-312528102 | Elrom Ben-Ami-316268283

import express, { Express } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from "path";
import cors from "cors";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ More Robust CORS Configuration
app.use(cors({
  origin: "http://localhost:5173", // ✅ Allow frontend access
  methods: "GET, POST, PUT, DELETE, OPTIONS", // ✅ Ensure all methods are allowed
  allowedHeaders: "Content-Type, Authorization",
  credentials: true, // ✅ Allows cookies & auth headers
}));

// ✅ Ensure Preflight Requests Are Handled
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// 🔹 Swagger Configuration
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: "InspireHub API",
            version: "1.0.0",
            description: "API documentation for InspireHub project",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}`,
            },
        ],
    },
    apis: ['./backend/src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);
console.log(`Swagger docs available at http://localhost:${process.env.PORT}/api-docs`);

// 🔹 Import Routes
import postRouter from './routes/posts_route';
import commentRouter from './routes/comments_route';
import authRouter from './routes/auth_route';
import { router as uploadRouter } from "./routes/upload_route";


// 🔹 Function to Initialize the Server
const initApp = async (): Promise<Express> => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ Connected to Database');

        // Static file serving
        app.use("/public/", express.static("backend/public"));
        app.use('/uploads', express.static(path.join(__dirname, "../uploads")));

        // 🔹 Use Routes
        app.use('/api/posts', postRouter);
        app.use('/api/comments', commentRouter);
        app.use('/api/auth', authRouter);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
        app.use("/api/uploads", uploadRouter);

        return app;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export default initApp;