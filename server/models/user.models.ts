import mongoose ,{Model,Schema,Document} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export interface IUser extends Document{
    name: string, 
    email: string,
    password: string,
    avatar: {
        public_id: string,
        url: string
    }
    role: string,
    isVerified: boolean,
    courses: Array<{ courseId: string }>,
    comparePassword: (password:string)=> Promise<boolean>;
    SignAccessToken:()=> string,
    SignRefreshToken:()=> string
};


const userSchema:Schema<IUser> = new mongoose.Schema({
    name:{
        type:String,
        required: [true, "Please enter your name!"]
    },
    email:{
        type: String,
        required: [true, "Please enter your email!"],
        validate:{
            validator: function (value:string){
                return emailRegexPattern.test(value);
            },
            message: "Please enter a valid email address"
        },
        unique:true
    },
    password:{
        type: String,
     
        minilength: [6, "Password must be at least 6 characters long"]
    },
    avatar:{
        public_id: String,
        url: String
    },
    role:{
        type: String,
        default:"User"
    },
    isVerified:{
        type: Boolean,
        default: false
    },
    courses:[
        {
            courseId: String
        }
    ]
},{timestamps: true});

userSchema.pre<IUser>("save", async function (next){
    if(!this.isModified("password")){
        next();
    }
    this.password= await bcrypt.hash(this.password,10);
    next()
});

userSchema.methods.comparePassword= async function (enterPassword: string): Promise<boolean>{
    return await bcrypt.compare(enterPassword,this.password)
}

// signin access token

userSchema.methods.SignAccessToken= function(){
    return jwt.sign({id: this._id},process.env.ACCESS_TOKEN )
}

// signin refresh token 

userSchema.methods.SignRefreshToken= function(){
    return jwt.sign({id: this._id},process.env.REFRESH_TOKEN )
}


const userModel: Model<IUser>= mongoose.model("User",userSchema);
export default userModel;