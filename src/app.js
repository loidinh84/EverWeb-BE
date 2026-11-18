import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Planner API is running",
    timestamp: new Date().toISOString(),
  });
});

export default app;
