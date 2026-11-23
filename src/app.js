import express from "express";
import cors from "cors";
import prisma from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import weddingRoutes from "./routes/weddingRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import uploadRoutes from "./routes/upload.routes.js";
import requestLogger from "./middlewares/loggerMiddleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/errorMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/weddings", weddingRoutes);
app.use("/api/feedbacks", feedbackRoutes);

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
});

app.use("/api/uploads", uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
