import express from "express";
import cors from "cors";
import prisma from "./config/db.js";
import requestLogger from "./middlewares/logger.middleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.status(200).json({
      status: "succsess",
      message: "Đã kết nối",
      data: { totalUsers: userCount },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "không thể kết đến CSDL",
      error: error.message,
    });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
