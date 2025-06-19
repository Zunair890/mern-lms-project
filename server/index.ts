import express, { NextFunction, Request, Response } from "express";
// ... existing code ...
import cookieParser from "cookie-parser"
import dotenv from "dotenv";
import cors  from "cors";
import connectDB from "./utils/db";
const app= express();

dotenv.config();

const PORT=4001
app.listen(()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
    connectDB()
});

app.use(express.json({limit:"50kb"}));
app.use(cookieParser()
)

app.use(cors({
    origin: process.env.ORIGIN
}));

app.get("/test",(req:Request, res:Response, next: NextFunction)=>{
    res.status(200).json({
        success:true,
        message:"Server is running!",
        
    })
});

// app.all("*",(req:Request, res:Response, next: NextFunction)=>{
//     const err= new Error(`Route ${req.originalUrl} not found`) as any;
//     err.statusCode=404;
//     next(err);
// })

// // Error handling middleware
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message || "Internal Server Error",
//     });
// });