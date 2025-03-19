// Hila Ben-Nissan-312528102 | Elrom Ben-Ami-316268283

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from "path";
import cors from "cors";
import axios from "axios";
import NodeCache from "node-cache";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
    origin: "*", // Allow frontend access
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true
  }));
  
  // Allow CORS for the ZenQuotes API
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allows all origins
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });  

// Proxy Route for Fetching Quotes
const quoteCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
app.get("/api/quote", async (req: Request, res: Response): Promise<void> => {
    try {
        // Check if quote is cached to prevent 429 errors
        const cachedQuote = quoteCache.get("motivationalQuote");
        if (cachedQuote) {
            res.json(cachedQuote);
            return;
        }

        // Fetch a new quote from ZenQuotes API through backend
        const response = await axios.get("https://zenquotes.io/api/random", {
            headers: {
                "User-Agent": "Mozilla/5.0" // Prevents ZenQuotes from rejecting requests
            }
        });

        const quote = response.data;
        quoteCache.set("motivationalQuote", quote); // Store in cache for 1 hour

        res.json(quote); // Send quote to frontend
    } catch (error) {
        console.error("❌ Error fetching quote:", error);
        res.status(500).json({ message: "Failed to fetch motivational quote." });
    }
});

// Ensure Preflight Requests Are Handled
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});

// Swagger Configuration
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
                url: `http://localhost:4040`,
            },
            {
                url: `http://10.10.246.42`,
            },
            {
                url: `https://10.10.246.42`,
            },
        ],
    },
    apis: ['./backend/src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);
console.log(`Swagger docs available!`);

// Import Routes
import postRouter from './routes/posts_route';
import commentRouter from './routes/comments_route';
import authRouter from './routes/auth_route';
import { router as uploadRouter } from "./routes/upload_route";


// Function to Initialize the Server
const initApp = async (): Promise<Express> => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set');
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to Database');

        // Static file serving
        app.use('/uploads', express.static(path.join(__dirname, "../uploads")));

        // Serve the React frontend
        app.use(express.static(path.join(__dirname, "../../../front")));

        // Use Routes
        app.use('/api/posts', postRouter);
        app.use('/api/comments', commentRouter);
        app.use('/api/auth', authRouter);
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
        app.use('/api/uploads', uploadRouter);

        return app;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export default initApp;