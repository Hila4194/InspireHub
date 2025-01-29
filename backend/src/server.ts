import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from './routes/auth_route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());

app.use('/auth', authRoute);

app.get("/", (req, res) => {
    res.send("InspireHub API is running...");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});