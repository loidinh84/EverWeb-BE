import express from "express";
import cors from "cors";
import morgan from "morgan";
import prisma from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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

export default app;
