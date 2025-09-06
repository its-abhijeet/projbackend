import express from "express";
import SellerController from "../controllers/SellerController";
import { auth } from "../middleware/auth";

const router = express.Router();

const sellerController = new SellerController();

router.get("/:sellerId/", auth, (req,res)=>{
    sellerController.sellers(req, res);
})


export default router;