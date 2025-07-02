// create order

import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../utils/catchAsyncError";
import { IOrder } from "../models/orderModel";
import userModel from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";
import courseModel from "../models/course.models";
import { newOrder } from "../services/orderService";
import path from "path";
import ejs from "ejs"
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notificationModel";

export const createOrder= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {courseId,payment_info}= req.body as IOrder;
        const user= await userModel.findById(req.user?._id);
        const courseExistInUser= user?.courses.some((c: any) => c.courseId === courseId);

        if (courseExistInUser) {
            return next(
              new ErrorHandler("You have already purchased this course", 400)
            );
          }

        const course= await courseModel.findById(courseId);
        if(!course){
            return next(new ErrorHandler("Course not found!",404));
        }

        // Create the order in the database
        const data:any={
            courseId: course._id,
            userId: user?._id,
            payment_info
        };


        // Prepare mail data with items array
        const mailData: any = {
            order: {
                _id: course._id?.toString().slice(0, 6),
                date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                items: [
                    {
                        name: course.name,
                        price: course.price
                    }
                ]
            },
            user: {
                name: user.name
            }
        };

        // Render EJS template with both order and user
        const html = await ejs.renderFile(
            path.join(__dirname, "../mails/order-confirmation.ejs"),
            { order: mailData.order, user: mailData.user }
        );

        try {
            if (user) {
                await sendMail({
                    email: user.email,
                    subject: "Order confirmation",
                    template: "order-confirmation.ejs",
                    data: { order: mailData.order, user: mailData.user }
                });
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }

        user.courses.push({ courseId: course._id.toString() });
        await user.save();

        await NotificationModel.create({
            user: user._id,
            title: "New Order",
            message: `Your order for ${course?.name} has been placed successfully.`,
        });

        res.status(201).json({
            success: true,
            order: data
        });

        course.purchased ? course.purchased+= 1: course.purchased;

        await course.save();
        await newOrder(data,res,next)
    } catch (error) {
       return next(new ErrorHandler(error.message,400))        
    }
})