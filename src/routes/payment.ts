import express from "express";
import { allCoupons, applyDiscount,  deleteCoupon, newCoupon, paymentReq, paymentVerify } from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app=express.Router();

// app.post("/create",createPayamentIntent)

app.post("/coupon/new",adminOnly,newCoupon)

app.get("/coupon/all",adminOnly,allCoupons)

app.post("/pay",paymentReq)

app.post("/verify",paymentVerify)

app.get("/discount/:code",applyDiscount)

app.get("/coupon/:id",deleteCoupon)

export default app;