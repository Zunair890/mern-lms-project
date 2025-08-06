import {Request, Response} from "express";
import userModel from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";

// get user by id

export const getUserById= async(id:string, res:Response)=>{
   const user = await userModel.findById(id);
   
   if(user){
    res.status(201).json({
        success: true,
        user
    })
   } else {
    res.status(404).json({
        success: false,
        message: "User not found"
    })
   }
}

// get all users

export const getAllUsersService= async(res:Response)=>{
    const users= await userModel.find().sort({createdAt:-1});

    res.status(201).json({
        success: true,
        users
    })
}


// update user role

export const updateUserRoleService= async(res:Response,id: string, role: string)=>{
    const user= await userModel.findByIdAndUpdate(id, {role},{new: true});

    res.status(201).json({
        success: true,
        user
    })
}