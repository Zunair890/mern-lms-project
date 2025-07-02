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