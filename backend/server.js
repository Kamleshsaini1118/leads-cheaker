import express from "express";
import cors from "cors";
import dndRoutes from "./routes/dndRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { testConnection } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

// Auth Routes
app.use("/api/auth", authRoutes);

// DND Routes
app.use("/api/dnd", dndRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("DND Search API is running...");
});

// Test database connection
testConnection();

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
