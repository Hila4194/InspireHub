// Hila Ben-Nissan-312528102 | Elrom Ben-Ami-316268283

import express, { Express } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from "path";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 CORS Configuration
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
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

// 🔹 Function to Initialize the Server
const initApp = async (): Promise<Express> => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('✅ Connected to Database');

        const app = express();
        app.use(express.json());

        // Static file serving
        app.use("/public/", express.static("backend/public"));
        app.use('/api/uploads', express.static(path.join(__dirname, "../uploads")));

        // 🔹 Use Routes
        app.use('/api/posts', postRouter);
        app.use('/api/comments', commentRouter);
        app.use('/api/auth', authRouter);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

        return app;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export default initApp;