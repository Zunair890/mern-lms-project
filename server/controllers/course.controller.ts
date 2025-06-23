import {v2 as cloudinary} from "cloudinary";
import { catchAsyncError } from "../utils/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse } from "../services/course.services";


// uploading the course
export const uploadCourse= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  
    try {
        const data= req.body;
        const thumbnail= data.thumbnail;
        if(thumbnail){
            const myCloud= await cloudinary.uploader.upload(thumbnail,{
                folder:"courses"
            });

            data.thumbnail={
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }

        }
        createCourse(data,res,next);

    } catch (error) {
        return next(new ErrorHandler(error,400));
    }
})