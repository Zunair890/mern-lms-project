// create course 

import { NextFunction, Response } from "express";
import { catchAsyncError } from "../utils/catchAsyncError";
import orderModel from "../models/orderModel";

export const newOrder = async (data: any,res: Response,next: NextFunction) => {
    const order = await orderModel.create(data);
    res.status(201).json({
        success:true,
        order
    })
    return order;
};


// get all orders 

export const getAllOrdersService= async(res:Response)=>{
    const orders= await orderModel.find().sort({createdAt:-1});

    res.status(201).json({
        success: true,
        orders
    })
}