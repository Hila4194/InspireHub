// Hila Ben-Nissan-312528102 | Elrom Ben-Ami-316268283

import express, { Express } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from "path";

// Load environment variables
dotenv.config();

// Swagger
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
        url: 'http://localhost:' + process.env.PORT,
      },
    ],
  },
  apis: ['./backend/src/routes/*.ts'],
};
const specs = swaggerJsdoc(options);
console.log("Swagger docs available at http://localhost:" + process.env.PORT + "/api-docs");

// Import routes
import postRouter from './routes/posts_route';
import commentRouter from './routes/comments_route';
import authRouter from './routes/auth_route';

// Create a function to initialize the server
const initApp = async (): Promise<Express> => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to Database');

    const app = express();
    app.use(express.json());

    app.use("/public/", express.static("backend/public"));
    app.use("/uploads/", express.static("backend/uploads"));
    
    // Use routers
    app.use('/api/posts', postRouter);
    app.use('/api/comments', commentRouter);
    app.use('/api/auth', authRouter);
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    app.use('/api/uploads', express.static(path.join(__dirname, "../uploads")));
  
    return app;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export default initApp;