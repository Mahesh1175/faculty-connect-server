import express from "express";
import Visitor from "../models/Visitor.js";
import Faculty from "../models/Faculty.js";
import { sendMail } from "../utils/sendMail.js";
import QRCode from "qrcode";

const router = express.Router();


// ============================
// CREATE VISITOR
// ============================
router.post("/", async (req, res) => {
  try {
    const visitor = await Visitor.create(req.body);

    const faculty = await Faculty.findOne({ name: visitor.facultyName });

    // 🔥 send emails WITHOUT breaking API
    try {
      await sendMail(
        visitor.email,
        "Request Submitted",
        `Your request to meet ${visitor.facultyName} is submitted.`
      );
    } catch (e) {
      console.log("⚠️ Visitor mail failed:", e.message);
    }

    try {
      if (faculty?.email) {
        await sendMail(
          faculty.email,
          "New Visitor Request",
          `
          <h2>New Visitor Request</h2>
          <p><b>Name:</b> ${visitor.visitorName}</p>
          <p><b>Mobile:</b> ${visitor.mobile}</p>
          <p><b>Email:</b> ${visitor.email}</p>
          <p><b>Reason:</b> ${visitor.reason}</p>
          `
        );
      }
    } catch (e) {
      console.log("⚠️ Faculty mail failed:", e.message);
    }

    res.status(201).json(visitor);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================
// GET BY FACULTY
// ============================
router.get("/:facultyName", async (req, res) => {
  try {
    const facultyName = decodeURIComponent(req.params.facultyName);

    const visitors = await Visitor.find({ facultyName })
      .sort({ createdAt: -1 });

    res.json(visitors);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================
// UPDATE STATUS
// ============================
router.put("/:id", async (req, res) => {
  try {
    console.log("🔥 Updating:", req.params.id, "→", req.body.status);

    const updated = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { returnDocument: "after" }
    );

    // ---------- DECLINED ----------
    if (updated.status === "declined") {
      try {
        await sendMail(
          updated.email,
          "Request Declined",
          "Sorry, your visit request was declined."
        );
      } catch (e) {
        console.log("⚠️ Declined mail failed:", e.message);
      }
    }

    // ---------- HOLD ----------
    if (updated.status === "hold") {
      try {
        await sendMail(
          updated.email,
          "Request On Hold",
          "Your request is on hold. Please wait."
        );
      } catch (e) {
        console.log("⚠️ Hold mail failed:", e.message);
      }
    }

    // ---------- APPROVED ----------
    if (updated.status === "approved") {
      try {
        const qrBuffer = await QRCode.toBuffer(updated._id.toString());

        const html = `
          <h2>Visitor Pass Approved 🎟️</h2>
          <p>Hello ${updated.visitorName},</p>
          <p>Your visit request is approved.</p>
          <p>QR code is attached.</p>
        `;

        await sendMail(
          updated.email,
          "Visitor Pass Approved",
          html,
          [{
            filename: "visitor-qr.png",
            content: qrBuffer,
            contentType: "image/png"
          }]
        );

      } catch (e) {
        console.log("⚠️ Approval mail failed:", e.message);
      }
    }

    // ✅ ALWAYS SUCCESS
    res.json(updated);

  } catch (err) {
    console.log("❌ PUT error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ============================
// VERIFY QR
// ============================
router.post("/verify", async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.body.id);

    if (!visitor || visitor.status !== "approved") {
      return res.json({ valid: false });
    }

    if (visitor.checkedIn) {
      return res.json({ valid: false });
    }

    visitor.checkedIn = true;
    visitor.checkedInAt = new Date();

    await visitor.save();

    res.json({ valid: true, visitor });

  } catch {
    res.json({ valid: false });
  }
});


export default router;
