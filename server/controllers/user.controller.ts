import {Request,Response,NextFunction} from "express";
import userModel,{IUser} from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs"
import jwt from "jsonwebtoken";
import { catchAsyncError } from "../utils/catchAsyncError";
import path from "path";
import sendMail from "../utils/sendMail";

interface IRegisterationBody{
    name: string,
    email: string,
    password: string,
    avatar?: string
}

export const registerationUser= catchAsyncError(async(req:Request,res:Response, next:NextFunction)=>{
    try {
        const {name,email,password}= req.body;
        const isEmailExist= await userModel.findOne({email});
        if(isEmailExist){
            return next(new ErrorHandler("Email already exists",400));
        }
        // User is NOT created yet. Creation happens after activation for security.
        const user: IRegisterationBody={
            name, email,password
        };

        const activationToken= createActivationToken(user);
        const activationCode= activationToken.activationCode;
        const data= {user:{name:user.name},activationCode};
        
        const html= await ejs.renderFile(path.join(__dirname,"../mails/activation-mails.ejs"),data);


        try {
            await sendMail({
                email: user.email,
                subject:"Activate your account",
                template:"activation-mails.ejs",
                data
            });

            res.status(201).json({
                success: true,
                message:"Please check your email to activate account!",
                activationToken: activationToken.token
            })
        } catch (error) {
            return next(new ErrorHandler(error.message,400))
        }

    } catch (error) {
        return next(new ErrorHandler(error.message,400));

    }
});

interface IActivationToken{
    token: string,
    activationCode: string
}

export const createActivationToken= (user:any): IActivationToken=>{
    const activationCode= Math.floor(1000* Math.random()*9000).toString();

    const token= jwt.sign({user,activationCode},process.env.ACTIVATION_SECRET,{expiresIn:"10min"} );
    return {token,activationCode}
}


// activate user

interface IActivationRequest{
    activation_token: string,
    activation_code: string
}

export const activateUser= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {activation_token,activation_code}=req.body as IActivationRequest;

        const newUser: { user: IUser; activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
          ) as { user: IUser; activationCode: string };
      
        if(newUser.activationCode !== activation_code){
            return next(new ErrorHandler("Invalid activation code",400));
        }

        const {name,email,password}= newUser.user;
        const existingUser= await userModel.findOne({email});
        if (existingUser) {
            return next(new ErrorHandler(' Email already exist', 400));
          }
      
          const user = await userModel.create({ email, password, name });
          res.status(200).json({ message:"success: true" });



    } catch (error) {
        return next( new ErrorHandler("Invalid activation code",400));
    }
})