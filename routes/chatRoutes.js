import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

// GET chat by requestId
router.get("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    let chat = await Chat.findOne({ requestId });
    
    // If chat doesn't exist, we return empty structure or null
    // You can also pre-create it if you want, but returning empty messages array is fine
    if (!chat) {
      chat = { requestId, messages: [] };
    }
    
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST message to chat
router.post("/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { sender, text, facultyName, visitorName } = req.body;

    let chat = await Chat.findOne({ requestId });
    
    if (!chat) {
      chat = new Chat({ requestId, facultyName, visitorName, messages: [] });
    }

    const newMessage = { sender, text, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) };
    chat.messages.push(newMessage);
    
    await chat.save();
    
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
