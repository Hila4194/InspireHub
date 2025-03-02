import express, {Express, NextFunction, Request, Response} from 'express';
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import authRoute from './routes/auth_route';
import postRoutes from "./routes/posts_route";
import commentRoutes from "./routes/comments_route";


const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoute);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);

const initApp = async () => {
    return new Promise<Express>(async (resolve, reject) => {
        const db = mongoose.connection;
        db.on("error", console.error.bind(console, "connection error:"));
        db.once("open", function() {
            console.log("Connected to the database");
        });
        if(!process.env.MONGO_URI){
            reject("DB_CONNECTION is not defined");
        } else {
            mongoose.connect(process.env.MONGO_URI).then(() => {
                resolve(app);
            })
            .catch((err) => {
                reject(err);
            });
        }
    });
};

export default initApp;