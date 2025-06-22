import e, {Request,Response,NextFunction} from "express";
import userModel,{IUser} from "../models/user.models";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs"
import jwt, { JwtPayload } from "jsonwebtoken";
import { catchAsyncError } from "../utils/catchAsyncError";
import path from "path";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.services";

import { v2 as cloudinary } from 'cloudinary';

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


interface ILoginRequest{
    email: string,
    password: string
}

export const loginUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as ILoginRequest;
  
    try {
      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
      }
      const user = await userModel.findOne({ email }).select('+password');
  
      if (!user || !(await user.comparePassword(password))) {
        return next(new ErrorHandler('Invalid email or Password', 400));
      }
      sendToken(user, 200,res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  });

  // loggout a user
export const logoutUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie('access_token', '', { maxAge: 1 });
    res.cookie('refresh_token', '', { maxAge: 1 });
    const userId = req.user?._id;
    if (userId) {
      await redis.del(String(userId));
    }
    res.status(200).json({ status: 'success', message: 'Logout successfully' });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


// update access token

export const updateAccessToken= catchAsyncError(async(req:Request,res: Response,next:NextFunction)=>{
    try {
        const refresh_token= req.cookies.refresh_token as string;
        const decoded= jwt.verify(refresh_token,process.env.REFRESH_TOKEN as string) as JwtPayload;

        const message= "Could not refresh the token!";
        if(!decoded){
            return next(new ErrorHandler(message,400));

        }

        const session= await redis.get(decoded.id as string);
        if(!session){
            return next(new ErrorHandler(message,400))
        }
        const user= JSON.parse(session);
        const accessToken= jwt.sign({id: user._id},process.env.ACCESS_TOKEN as string,{
            expiresIn:"5m"
        });

        const refreshToken= jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string,{
            expiresIn:"3d"
        });

        res.cookie("access_token",accessToken,accessTokenOptions);
        res.cookie("refresh_token",refreshToken,refreshTokenOptions);

        res.status(200).json({
            status:"success",
            accessToken
        })
    } catch (error) {
        return next(new ErrorHandler("Could not refresh the token!", 400));
    }
})


// get user info

export const getUserInfo= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
   try {
    const userId= req.user?._id;
    if (!userId) {
        return next(new ErrorHandler("User not found", 400));
    }
    await getUserById(String(userId), res);
   } catch (error) {
    return next(new ErrorHandler(error.message, 400))
   }
});


// social auth

interface ISocialAuthBody{
    name: string,
    email:string,
    avatar?:string
}

export const socialAuth= catchAsyncError(async(req:Request, res:Response,next:NextFunction)=>{
    try {
        const {name,email, avatar}= req.body as ISocialAuthBody;
        const user= await userModel.findOne({email});
        if(!user){
            const newUser= await userModel.create({name,email,avatar});
            sendToken(newUser,200,res);
        }
        else{
            sendToken(user,200,res);
        }
    } catch (error) {
     
        return next(new ErrorHandler(error.message,400))
    }
})

// update user info

interface IUpdateUserInfo{
    name?: string;
    email?:string;
}

export const updateUserInfo= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        if (!req.body) {
            return next(new ErrorHandler("Request body is missing", 400));
        }
        const {name,email}= req.body as IUpdateUserInfo;
        
        // Debug logging to understand what's happening
        
        
        // Check if req.user exists and has _id
        if (!req.user || !req.user._id) {
            return next(new ErrorHandler("User not authenticated or user data missing", 401));
        }
        
        const userId = req.user._id;
        console.log('userId:', userId);
        
        // Find user in database
        const user = await userModel.findById(userId);
        
        // Check if user exists in database
        if (!user) {
            return next(new ErrorHandler("User not found in database", 404));
        }

        // Check if email already exists (only if email is being updated and it's different)
        if(email && email !== user.email){
            const isEmailExist = await userModel.findOne({email});
            if(isEmailExist){
                return next(new ErrorHandler("Email already exists", 400));
            }
            user.email = email;
        }
        
        // Update name if provided
        if(name){
            user.name = name;
        }

        // Save the updated user
        await user.save();
        
        // Update Redis cache with the fresh user data
        await redis.set(String(userId), JSON.stringify(user));
        
        res.status(200).json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Error in updateUserInfo:', error);
        return next(new ErrorHandler(error.message || "Internal server error", 500));
    }
})


// update user password

interface IUpdatePassword{
    oldPassword: string,
    newPassword: string
}

export const updatePassword=catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
       
                const {oldPassword,newPassword}= req.body as IUpdatePassword;
                console.log(req.body)

        // Validate that both passwords are provided
        if(!oldPassword || !newPassword){
            return next(new ErrorHandler("Please provide both old and new password", 400));
        }

        // Check if user is authenticated
        if (!req.user || !req.user._id) {
            return next(new ErrorHandler("User not authenticated", 401));
        }

        // Find user with password field included
        const user = await userModel.findById(req.user._id).select("+password");

        // Check if user exists
        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        // Check if user has a password (for social auth users who might not have passwords)
        if (!user.password || user.password === "undefined") {
            return next(new ErrorHandler("Password update not allowed for this account type", 400));
        }

        // Verify old password
        const isPasswordMatch = await user.comparePassword(oldPassword);

        if (!isPasswordMatch) {
            return next(new ErrorHandler("Old password is incorrect!", 400));
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Update Redis cache
        await redis.set(String(user._id), JSON.stringify(user));

        res.status(200).json({
            success: true,
            message: "Password updated successfully",
           
        });
    } catch (error) {
        console.error('Error in updatePassword:', error);
        return next(new ErrorHandler(error.message || "Internal server error", 500));        
    }
})


// update profile picture

interface IUpdateProfilePicture{
    avatar: string
}

export const updateProfilePicture= catchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const {avatar}= req.body as IUpdateProfilePicture;
        const userId= req.user?._id;
        const user= await userModel.findById(userId);

        if(avatar && user){
            // if user has the avatar

            if(user?.avatar?.public_id){
                await cloudinary.uploader.destroy(user?.avatar?.public_id);
                const myCloud= await cloudinary.uploader.upload(avatar,{
                    folder:"avatars",
                    width:150
                });
                user.avatar={
                    public_id: myCloud.public_id,
                    url:myCloud.secure_url
                }
            }
            else{
                const myCloud= await cloudinary.uploader.upload(avatar,{
                    folders:"avatars",
                    width: 150
                });
                user.avatar={
                    public_id: myCloud.public_id,
                    url:myCloud.secure_url
                }



            }
        }

        await user?.save();
        await redis.set(userId as string, JSON.stringify(user));
        res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        return next(new ErrorHandler(error.message,400));
    }
})