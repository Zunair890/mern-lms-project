import express from "express" ;
import { activateUser, loginUser, logoutUser, registerationUser } from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const userRouter= express.Router();

userRouter.post("/register",registerationUser);
userRouter.post("/activate-user",activateUser);
userRouter.post("/login",loginUser);
userRouter.get("/logout",isAuthenticated,authorizeRoles("admin"),logoutUser)

export default userRouter