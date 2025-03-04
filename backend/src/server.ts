import express, {Express} from 'express';
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRoute from './routes/auth_route';
import postRoutes from "./routes/posts_route";
import commentRoutes from "./routes/comments_route";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/auth', authRoute);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);

// Swagger Configuration
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "InspireHub API",
            version: "1.0.0",
            description: "API documentation for InspireHub project",
        },
        servers: [{url: "http://localhost:3000",},],
    },
    apis: ["./backend/src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
console.log("Swagger docs available at http://localhost:3000/api-docs");

const initApp = async (): Promise<Express> => {
    return new Promise<Express>(async (resolve, reject) => {
        if (!process.env.MONGO_URI) {
            console.error("Error: MONGO_URI is not defined in the environment variables.");
            process.exit(1);
        }

        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("Connected to the database");
            resolve(app);
        } catch (error) {
            console.error("Database connection error:", error);
            process.exit(1);
        }
    });
};

export default initApp;