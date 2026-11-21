import express from "express";
import cors from "cors";
import prisma from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import requestLogger from "./middlewares/loggerMiddleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/errorMiddleware.js";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.status(200).json({
      status: "success",
      message: "Đã kết nối CSDL Neon!",
      data: { totalUsers: userCount },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Không thể kết nối đến CSDL",
      error: err.message,
    });
  }
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Planner API is running",
    timestamp: new Date().toISOString(),
  });
});

export default app;
