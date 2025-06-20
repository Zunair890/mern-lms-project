import express, { NextFunction, Request, Response } from "express";
// ... existing code ...
import cookieParser from "cookie-parser"
import dotenv from "dotenv";
import cors  from "cors";
import connectDB from "./utils/db";
import userRouter from "./routes/userRoute";
import ErrorHandler from "./utils/ErrorHandler";
const app= express();

dotenv.config();

// api endpoints

app.use(express.json({limit:"50kb"}));

app.use(express.urlencoded({extended:true,limit:"50kb"}));

app.use(cookieParser());

app.use(cors({
    origin: process.env.ORIGIN || "http://localhost:3000",
    credentials: true // if you're using cookies
  }));
  

app.use("/api/v1",userRouter);

const PORT = 8080
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});

app.get("/test",(req:Request, res:Response, next: NextFunction)=>{
    res.status(200).json({
        success:true,
        message:"Server is running!",
       
    })
});

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the server!"
    });
});

// Catch-all for undefined routes
