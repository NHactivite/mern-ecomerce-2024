import express from "express";
import { allCoupons, applyDiscount,  deleteCoupon, getCoupon, newCoupon, paymentReq, paymentVerify, updateCoupon } from "../controllers/payment.js";
import { adminOnly } from "../middlewares/auth.js";

const app=express.Router();

// app.post("/create",createPayamentIntent)

app.post("/coupon/new",adminOnly,newCoupon)

app.get("/coupon/all",adminOnly,allCoupons)

app.post("/pay",paymentReq)

app.post("/verify",paymentVerify)

app.get("/discount/:code",applyDiscount)

app.route("/coupon/:id").get(adminOnly,getCoupon).delete(adminOnly,deleteCoupon ).put(adminOnly,updateCoupon)

export default app;