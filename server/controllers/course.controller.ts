import {v2 as cloudinary} from "cloudinary";
import { catchAsyncError } from "../utils/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse } from "../services/course.services";
import courseModel from "../models/course.models";


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
});


// edit the course

export const editCourse= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const data= req.body;
        const thumbnail= data.thumbnail;
        if(thumbnail){
            await cloudinary.uploader.destroy(thumbnail.public_id);
            const myCloud= await cloudinary.uploader.upload(thumbnail,{
                folder:"courses"
            });

            data.thumbnail={
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }

        const courseId= req.params.id;
        const course= await courseModel.findByIdAndUpdate(courseId,{
            $set:data
        },{
            new: true
        })
        res.status(201).json({
            success: true,
            course
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,400));
    }
})


// get single course - without purchasing

export const getSingleCourse= catchAsyncError(async(req:Request,res:Response,next: NextFunction)=>{
    try {
        const course= await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(200).json({
            success: true,
            course
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,400));
    }
})

// get all courses - without purchasing

export const getAllCourses= catchAsyncError(async(req:Request,res:Response,next: NextFunction)=>{
    try {
        const course= await courseModel.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
        res.status(200).json({
            success: true,
            course
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,400));
    }
})