import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  name: String,
  dept: String,
  email: String 
});

export default mongoose.model("Faculty", facultySchema);
