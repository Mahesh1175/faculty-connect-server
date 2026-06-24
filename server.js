import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import visitorRoutes from "./routes/visitorRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import Chat from "./models/Chat.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
dotenv.config();




const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "*",
     methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

app.use(express.json());



mongoose.connect(process.env.MONGO_URI)


const PORT = process.env.PORT || 5000;

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
app.use("/api/chats", chatRoutes);

// Socket.io connection logic
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Join a specific chat room
  socket.on("join_room", (requestId) => {
    socket.join(requestId);
    console.log(`👤 User with ID ${socket.id} joined room: ${requestId}`);
  });

  // Handle messages
  socket.on("send_message", async (data) => {
    console.log("💬 Message received:", data);
    
    try {
      let chat = await Chat.findOne({ requestId: data.roomId });
      if (!chat) {
        chat = new Chat({ requestId: data.roomId, messages: [] });
      }
      const messageObj = {
        sender: data.sender,
        text: data.text,
        time: data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      chat.messages.push(messageObj);
      await chat.save();
    } catch (err) {
      console.log("Error saving chat via socket:", err);
    }

    // Broadcast the message to everyone in the room EXCEPT the sender
    socket.to(data.roomId).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);