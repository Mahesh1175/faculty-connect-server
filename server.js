import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import visitorRoutes from "./routes/visitorRoutes.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();




const app = express();

app.use(cors());
app.use(express.json());



mongoose.connect(process.env.MONGO_URI)


// 🔥 Log every request
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});


app.get("/", (req, res) => {
  console.log("📥 Root accessed");
  res.send("Hi, I'm working ✅");
});

app.get("/api", (req, res) => {
  console.log("📥 API base accessed");
  res.send("API is base for all 🚀");
});

app.use("/api/visitors", visitorRoutes);

app.listen(5000, () =>
  console.log("🚀 Server running at http://localhost:5000")
);