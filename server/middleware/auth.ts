import {Request,Response,NextFunction} from "express";
import { catchAsyncError } from "../utils/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import jwt,{JwtPayload} from "jsonwebtoken";
import userModel from "../models/user.models";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  try {
    const access_token = req.cookies.access_token;
    if (!access_token) {
      return next(new ErrorHandler("Please login to access this resource", 401));
    }
    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    if (!decoded || !decoded.id) {
      return next(new ErrorHandler("Access token is not valid", 401));
    }

    // Get user directly from database
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    
    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler("Authentication failed", 401));
  }
});

// validate user role

export const authorizeRoles= (...roles: string[])=>{
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return next(new ErrorHandler("User role not found", 403));
        }
        
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: ${req.user.role} is not allowed to access this resource`, 403));
        }
        next();
    };
}