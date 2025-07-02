import {v2 as cloudinary} from "cloudinary";
import { catchAsyncError } from "../utils/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse } from "../services/course.services";
import courseModel from "../models/course.models";
import { redis } from "../utils/redis";
import mongoose from "mongoose";


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
         
        const courseId= req.params.id;
        const isCatcheExist= await redis.get(courseId);
        console.log("hitting redis")
        if(isCatcheExist){
            const course= JSON.parse(isCatcheExist);
            res.status(200).json({
                success: true,
                course
            })
        }

        else{
 
            console.log("courseId", courseId);
            const course = await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");
             console.log("hitting mongodb")
            await redis.set(courseId,JSON.parse(isCatcheExist));
           res.status(200).json({
            success: true,
            course
        })
        }


        
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
});


// get course content - only for valid user 

export const getCourseByUser= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const userCourseList= req.user?.courses;
        const courseId= req.params.id;
        console.log(courseId)
        const courseExists = userCourseList?.some((course: any) => {
            // Support both {courseId} and {_id}
            return (course.courseId?.toString() === courseId.toString()) || (course._id?.toString() === courseId.toString());
        });

        console.log("courseExists",courseExists)
        console.log(userCourseList)
        if(!courseExists){
            return next(new ErrorHandler("Your are not eligible to acces this course",400));

        }

       
        const course = await courseModel.findById(courseId).select("+courseData");
       
        const content= course?.courseData;

        res.status(200).json({
            success: true,
            content
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,400));
    }
});


interface IAddQuestionData{
    question: string,
    courseId: string,
    contentId: string
}

//add question in course
interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;

      const course = await courseModel.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalidss content id", 400));
      }

      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };

      //add this question to our course
      courseContent.questions.push(newQuestion);

     
      //save the updated course
      await course?.save();

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// add review in the course

interface IAddReviewData{
    review: string,
    rating: number,
    userId: string
}

export const addReview= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const userCourseList= req.user?.courses;
        console.log(req.user.courses)
        const courseId= req.params.id;

        console.log(userCourseList);
        console.log(req.user)
        console.log(courseId)

        const courseExists = userCourseList?.some((course: any) => {
            // Support both {courseId} and {_id}
            return (course.courseId?.toString() === courseId.toString()) || (course._id?.toString() === courseId.toString());
        });

        if(!courseExists){
            return next(new ErrorHandler("You are not eliigle to access this course",400));

        }
        const course= await courseModel.findById(courseId);
        const {review,rating}= req.body as IAddReviewData;
        const reviewData:any={
            user:req.user,
            rating,
            comment: review
        }
        course?.reviews.push(reviewData);

        // calculate the average rating

        let avg=0;
        course?.reviews.forEach((rev:any)=>{
            avg+= rev.rating;
        });
        if(course){
            course.ratings= avg/course.reviews.length;
        }
        await course?.save();
        const notification= {
            title:"New review received!",
            message:`${req.user?.name} has given a review in ${course?.name}`
        }
        res.status(200).json({
            success: true,
            course
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,400))
    }
})