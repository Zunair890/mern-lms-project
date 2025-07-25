
import express from "express";
import {addQuestion, addReview, deleteCourse, editCourse, getAllCourses, getCourseByUser, getSingleCourse, uploadCourse} from "../controllers/course.controller";
import { authorizeRoles,isAuthenticated } from "../middleware/auth";

const courseRouter= express.Router();

courseRouter.post("/create-course",isAuthenticated,authorizeRoles("admin"),uploadCourse);
courseRouter.put("/edit-course/:id",isAuthenticated,authorizeRoles("admin"),editCourse);
courseRouter.get("/get-course/:id",getSingleCourse);
courseRouter.get("/get-courses/:id",getAllCourses);
courseRouter.get("/get-course-content/:id",isAuthenticated,getCourseByUser);
courseRouter.put("/add-question",isAuthenticated,addQuestion);
courseRouter.put("/add-review/:id",isAuthenticated,addReview);
courseRouter.get("/get-courses",isAuthenticated,authorizeRoles("admin"), getAllCourses);
courseRouter.delete("/delete-course/:id",isAuthenticated,authorizeRoles("admin"), deleteCourse);

export default courseRouter;