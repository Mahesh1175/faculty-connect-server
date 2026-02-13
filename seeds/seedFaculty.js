import mongoose from "mongoose";
import dotenv from "dotenv";
import Faculty from "../models/Faculty.js"; // ⭐ THIS WAS MISSING

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("DB connected");

    await Faculty.deleteMany();

    await Faculty.insertMany([
      { name: "Prof. Shital Ghule", dept: "IT", email: "shital@college.com" },
      { name: "Dr. Jyoti Surve", dept: "IT", email: "jyoti@college.com" },
      { name: "Prof. Kimi Ramteke", dept: "CS", email: "kimi@college.com" },
      { name: "Dr. Shital Wadgavane", dept: "CS", email: "wadgavane@college.com" },
      { name: "Prof. V. Jadhav", dept: "ENTC", email: "jadhav@college.com" },
      { name: "Prof. Mahesh Galange", dept: "IT", email: "mgalange18@gmail.com" }
    ]);

    console.log("Faculty seeded successfully ✅");

    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

seed();
