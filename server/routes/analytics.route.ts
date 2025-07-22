import express from "express";
import { authorizeRoles,isAuthenticated } from "../middleware/auth";
import { getCourseAnalytics, getOrdersAnalytics, getUsersAnalytics } from "../controllers/analytics.controllers";

 const analyticsRouter= express.Router();

analyticsRouter.get("/get-user-analytics",isAuthenticated,authorizeRoles("admin"),getUsersAnalytics);
analyticsRouter.get("/get-course-analytics",isAuthenticated,authorizeRoles("admin"),getCourseAnalytics);
analyticsRouter.get("/get-order-analytics",isAuthenticated,authorizeRoles("admin"),getOrdersAnalytics);

export default analyticsRouter;