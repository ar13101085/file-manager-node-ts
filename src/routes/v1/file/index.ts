import express from 'express';
import { fileHandlerRouter } from './file-router';
const router = express.Router();
router.use(fileHandlerRouter)
export { router as fileRoutes };