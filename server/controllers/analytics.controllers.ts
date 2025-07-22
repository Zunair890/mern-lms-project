import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../utils/catchAsyncError";
import { generateLast12MothsData } from "../utils/analytics.generator";
import userModel from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";
import courseModel from "../models/course.models";
import orderModel from "../models/orderModel";

// get users analytics --- only for admin
export const getUsersAnalytics = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const users = await generateLast12MothsData(userModel);
  
        res.status(200).json({
          success: true,
          users,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );

  // get course analytics --- only for admin
export const getCourseAnalytics = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const courses = await generateLast12MothsData(courseModel);
  
        res.status(200).json({
          success: true,
          courses,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );


  // get orders analytics --- only for admin
export const getOrdersAnalytics = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orders = await generateLast12MothsData(orderModel);
  
        res.status(200).json({
          success: true,
          orders,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }
    }
  );