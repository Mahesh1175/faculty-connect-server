import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  visitorName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  dept: {
    type: String,
    required: true
  },
  facultyName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "hold", "declined"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: Date
  ,
});

export default mongoose.model("Visitor", visitorSchema);