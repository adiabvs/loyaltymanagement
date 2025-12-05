import { Router } from "express";
import { CustomerController } from "../controllers/CustomerController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// All customer routes require authentication and customer role
router.use(authenticate);
router.use(requireRole("customer"));

router.get("/dashboard", CustomerController.getDashboard);
router.get("/qr", CustomerController.getQRCode);
router.get("/rewards", CustomerController.getRewards);
router.post("/rewards/redeem", CustomerController.redeemReward);
router.get("/promotions", CustomerController.getPromotions);

export default router;

