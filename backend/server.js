import express from "express";
import cors from "cors";
import dndRoutes from "./routes/dndRoutes.js";
import { db } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

// DND Routes
app.use("/api/dnd", dndRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("DND Search API is running...");
});



async function test() {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("DB CONNECTED ✔", rows);
  } catch (err) {
    console.log("DB ERROR ❌", err);
  }
}

test();


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
