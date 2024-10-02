import express from "express";
import { allOrders, deleteOrder, getSingleOrder, myOrder, newOrder, processOrder } from "../controllers/order.js";
import { adminOnly } from "../middlewares/auth.js";

const app=express.Router();

// route /api/v1/order/new
app.post("/new",newOrder);

app.get("/my",myOrder);

app.get("/all",adminOnly,allOrders);

app.route("/:id").get(getSingleOrder).put(adminOnly,processOrder).delete(adminOnly,deleteOrder)


export default app;