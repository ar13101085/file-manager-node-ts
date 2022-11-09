import express from 'express';
import { fileRoutes } from './file';
const router = express.Router();
import { userRouter } from "./user";
router.use("/auth", userRouter);
router.use("/file", fileRoutes);
export { router as routes };