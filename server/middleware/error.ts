import { NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";

export const errorMiddleware= (
    err:any,
    req:Request,
    res:Response,
    next: NextFunction
)=>{
    err.statusCode= err.statusCode || 500;
    err.message= err.message || "Internal Server Error";

    // wrong mongodb id error

    if(err.name==="CastError"){
        const message= `Resourse not found. Invalid ${err.path}`;
        err= new ErrorHandler(message,400);
    }

    // duplicate key error

    if(err.code=== 1100){
        const message= `Duplicate ${Object.keys(err.keyValue)} entered`;
        err= new ErrorHandler(message,400);
    }

    // json web token error

    if(err.name==="JsonWebTokenError"){
        const message= `Json web token is invalid, try again`;
        err= new ErrorHandler(message,400);

    }

    // JWT expired error

    if(err.name==="TokenExpiredError"){
        const message= `Json web token is expired, try again`;
        err= new ErrorHandler(message,400)
    }

    
}