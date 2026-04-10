import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true
  },
  facultyName: String,
  visitorName: String,
  messages: [
    {
      sender: String,
      text: String,
      time: {
        type: String,
        default: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    }
  ]
});

export default mongoose.model("Chat", chatSchema);
