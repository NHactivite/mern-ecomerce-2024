import express from "express";
import { getBarCharts, getDashboardStats, getLineCharts, getPieChart } from "../controllers/stats.js";
import { adminOnly } from "../middlewares/auth.js";


const app=express.Router();
app.get("/stats",adminOnly,getDashboardStats);

app.get("/pie",adminOnly,getPieChart);

app.get("/bar",adminOnly,getBarCharts);

app.get("/line",adminOnly,getLineCharts);

export default app;