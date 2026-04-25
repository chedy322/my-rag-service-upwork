import { Router } from "express";
import { authorize } from "../middleware/authorize.js";
import {  getLogsforAdmin, renderAdminPage, verifyAdminStatus } from "../controllers/adminController.js";
const router=Router()

router.get("/dashboard", renderAdminPage);

// 2. The API Check (Protected by Firebase)
router.get("/api/verify", authorize, verifyAdminStatus);
router.get("/api/logs", authorize, getLogsforAdmin);
export default router;
