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

    const faculty = await Faculty.findOne({
      name: visitor.facultyName,
    });

    // Visitor email
    try {
      console.log("📧 Sending visitor email to:", visitor.email);

      await sendMail(
        visitor.email,
        "Request Submitted",
        `
          <h2>Request Submitted</h2>
          <p>Your request to meet <b>${visitor.facultyName}</b> has been submitted.</p>
          <p>Please wait for approval.</p>
        `
      );

      console.log("✅ Visitor email sent");
    } catch (e) {
      console.log("⚠️ Visitor mail failed:", e.message);
    }

    // Faculty email
    try {
      console.log(
        "👨‍🏫 Faculty found:",
        faculty?.name,
        faculty?.email
      );

      if (faculty?.email) {
        console.log("📧 Sending faculty email to:", faculty.email);

        await sendMail(
          faculty.email,
          "New Visitor Request",
          `
          <h2>New Visitor Request</h2>

          <p><b>Name:</b> ${visitor.visitorName}</p>
          <p><b>Mobile:</b> ${visitor.mobile}</p>
          <p><b>Email:</b> ${visitor.email}</p>
          <p><b>Reason:</b> ${visitor.reason}</p>

          <br/>

          <a
            href="${process.env.FRONTEND_URL}/faculty-dashboard"
            style="
              display:inline-block;
              padding:10px 15px;
              background:#000;
              color:#fff;
              text-decoration:none;
              border-radius:5px;
            "
          >
            Go To Dashboard
          </a>
        `
        );

        console.log("✅ Faculty email sent");
      }
    } catch (e) {
      console.log("⚠️ Faculty mail failed:", e.message);
    }

    res.status(201).json(visitor);
  } catch (err) {
    console.log("❌ Create Visitor Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================
// GET SINGLE REQUEST
// IMPORTANT: ABOVE /:facultyName
// ============================
router.get("/request/:id", async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        error: "Visitor request not found",
      });
    }

    res.json(visitor);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ============================
// GET BY FACULTY
// ============================
router.get("/:facultyName", async (req, res) => {
  try {
    const facultyName = decodeURIComponent(
      req.params.facultyName
    );

    const visitors = await Visitor.find({
      facultyName,
    }).sort({
      createdAt: -1,
    });

    res.json(visitors);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// ============================
// UPDATE STATUS
// ============================
router.put("/:id", async (req, res) => {
  try {
    console.log(
      "🔥 Updating:",
      req.params.id,
      "→",
      req.body.status
    );

    const updated = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      {
        new: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        error: "Visitor not found",
      });
    }

    // ============================
    // DECLINED
    // ============================
    if (updated.status === "declined") {
      try {
        console.log(
          "📧 Sending declined mail to:",
          updated.email
        );

        await sendMail(
          updated.email,
          "Request Declined",
          `
            <h2>Request Declined</h2>
            <p>Sorry, your visit request was declined.</p>
          `
        );
      } catch (e) {
        console.log(
          "⚠️ Declined mail failed:",
          e.message
        );
      }
    }

    // ============================
    // HOLD
    // ============================
    if (updated.status === "hold") {
      try {
        console.log(
          "📧 Sending hold mail to:",
          updated.email
        );

        await sendMail(
          updated.email,
          "Request On Hold",
          `
            <h2>Request On Hold</h2>
            <p>Your request is currently on hold.</p>
          `
        );
      } catch (e) {
        console.log(
          "⚠️ Hold mail failed:",
          e.message
        );
      }
    }

    // ============================
    // APPROVED
    // ============================
    if (updated.status === "approved") {
      try {
        console.log(
          "📧 Sending approval mail to:",
          updated.email
        );

        const qrBuffer = await QRCode.toBuffer(
          updated._id.toString()
        );

        const html = `
          <h2>Visitor Pass Approved 🎟️</h2>

          <p>Hello ${updated.visitorName},</p>

          <p>Your visitor request has been approved.</p>

          <p>
            Chat with
            <b>${updated.facultyName}</b>
            here:
          </p>

          <a href="${process.env.FRONTEND_URL}/chat/${updated._id}">
            Open Chat
          </a>

          <br/><br/>

          <p>Your QR pass is attached.</p>
        `;

        await sendMail(
          updated.email,
          "Visitor Pass Approved",
          html,
          [
            {
              filename: "visitor-qr.png",
              content: qrBuffer.toString("base64"),
            },
          ]
        );

        console.log("✅ Approval email sent");
      } catch (e) {
        console.log(
          "⚠️ Approval mail failed:",
          e.message
        );
      }
    }

    res.json(updated);
  } catch (err) {
    console.log("❌ PUT error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// ============================
// VERIFY QR
// ============================
router.post("/verify", async (req, res) => {
  try {
    const visitor = await Visitor.findById(
      req.body.id
    );

    if (!visitor || visitor.status !== "approved") {
      return res.json({
        valid: false,
        message: "Not an approved visitor",
      });
    }

    if (
      visitor.checkedIn &&
      visitor.checkedOut
    ) {
      return res.json({
        valid: false,
        message: "Visitor already checked out",
      });
    }

    if (
      visitor.checkedIn &&
      !visitor.checkedOut
    ) {
      const now = new Date();

      const secondsSinceCheckin =
        (now.getTime() -
          new Date(visitor.checkedInAt).getTime()) /
        1000;

      if (secondsSinceCheckin < 15) {
        return res.json({
          valid: false,
          message:
            "Visitor already checked in. Wait a few seconds before checkout.",
        });
      }

      visitor.checkedOut = true;
      visitor.checkedOutAt = now;

      await visitor.save();

      return res.json({
        valid: true,
        visitor,
        type: "checkout",
      });
    }

    visitor.checkedIn = true;
    visitor.checkedInAt = new Date();

    await visitor.save();

    res.json({
      valid: true,
      visitor,
      type: "checkin",
    });
  } catch (err) {
    res.json({
      valid: false,
      message: err.message,
    });
  }
});

// ============================
// GUARD LOGS
// ============================
router.get("/guard/logs", async (req, res) => {
  try {
    const logs = await Visitor.find({
      checkedIn: true,
    }).sort({
      checkedInAt: -1,
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

export default router;