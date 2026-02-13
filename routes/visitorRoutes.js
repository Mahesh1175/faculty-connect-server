import express from "express";
import Visitor from "../models/Visitor.js";
import { sendMail } from "../utils/sendMail.js";
import QRCode from "qrcode";
import Faculty from "../models/Faculty.js";

const router = express.Router();


// ✅ CREATE visitor
router.post("/", async (req, res) => {
  try {
    const visitor = await Visitor.create(req.body);

    const faculty = await Faculty.findOne({
      name: visitor.facultyName
    });

    // visitor confirmation
    console.log("📩 Sending visitor mail...");
    await sendMail(
      visitor.email,
      "Request Submitted",
      `Your request to meet ${visitor.facultyName} is submitted.`
    );

    // faculty notification
    console.log("📩 Sending faculty mail...");
    if (faculty?.email) {
      await sendMail(
        faculty.email,
        "New Visitor Request",
        `
        <h2>New Visitor Request</h2>

        <p><b>Name:</b> ${visitor.visitorName}</p>
        <p><b>Mobile:</b> ${visitor.mobile}</p>
        <p><b>Email:</b> ${visitor.email}</p>
        <p><b>Department:</b> ${visitor.dept}</p>
        <p><b>Reason:</b> ${visitor.reason}</p>
        <p><b>Requested At:</b> ${new Date(visitor.createdAt).toLocaleString()}</p>
        `
      );
    }

    res.status(201).json(visitor);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ GET by faculty
router.get("/:facultyName", async (req, res) => {
    try {
        const facultyName = decodeURIComponent(req.params.facultyName);

        console.log("Searching for:", facultyName);

        const visitors = await Visitor.find({ facultyName })
            .sort({ createdAt: -1 });

        res.json(visitors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ✅ UPDATE status
router.put("/:id", async (req, res) => {
    try {
        console.log("🔥 Updating:", req.params.id, "→", req.body.status);

        const updated = await Visitor.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { returnDocument: "after" }
        );


        if (updated.status === "declined") {
            await sendMail(
                updated.email,
                "Request Declined",
                "Sorry, your visit request was declined."
            );
        }

        if (updated.status === "hold") {
            await sendMail(
                updated.email,
                "Request On Hold",
                "Your request is on hold. Please wait."
            );
        }


        // ONLY when approved
        if (updated.status === "approved") {

            // ✅ Encode ALL details
            // const qrPayload = {
            //     id: updated._id,
            //     visitorName: updated.visitorName,
            //     email: updated.email,
            //     mobile: updated.mobile,
            //     facultyName: updated.facultyName,
            //     dept: updated.dept,
            //     reason: updated.reason,
            //     createdAt: updated.createdAt
            // };

            // const qrDataString = JSON.stringify(qrPayload);


            const qrDataString = updated._id.toString();



            // generate base64 QR
            //   const qrImage = await QRCode.toDataURL(qrDataString);
            const qrBuffer = await QRCode.toBuffer(qrDataString);


            // ✅ Professional email template
            const html = `
        <div style="font-family: Arial; padding: 20px">
          <h2>🎉 Visitor Pass Approved</h2>

          <p>Hello <b>${updated.visitorName}</b>,</p>
          <p>Your visit request has been approved. Please show this QR code at entry.</p>

          <hr/>

          <h3>📋 Visit Details</h3>
          <p><b>Visitor:</b> ${updated.visitorName}</p>
          <p><b>Faculty:</b> ${updated.facultyName}</p>
          <p><b>Department:</b> ${updated.dept}</p>
          <p><b>Reason:</b> ${updated.reason}</p>
          <p><b>Date:</b> ${new Date(updated.createdAt).toLocaleString()}</p>

          <br/>

          <h3>🔳 Entry QR Code</h3>
         <p><b>QR code is attached with this email.</b></p>


          <p style="margin-top:20px;color:gray;">
            Please carry this email while visiting campus.
          </p>
        </div>
      `;

            await sendMail(
                updated.email,
                "Visitor Pass Approved 🎟️",
                html, [
                {
                    filename: "visitor-qr.png",
                    content: qrBuffer,
                    contentType: "image/png"
                }
            ]
            );

            console.log("📧 Email with QR + details sent");
        }




        res.json(updated);

    } catch (err) {
        console.log("❌ PUT error:", err);
        res.status(500).json({ error: err.message });
    }
});




router.post("/verify", async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.body.id);

        if (!visitor || visitor.status !== "approved") {
            return res.json({ valid: false });
        }

        // prevent reuse
        if (visitor.checkedIn) {
            return res.json({
                valid: false,
                message: "Already entered"
            });
        }

        // mark entry
        visitor.checkedIn = true;
        visitor.checkedInAt = new Date();

        await visitor.save();

        res.json({
            valid: true,
            visitor
        });

    } catch {
        res.json({ valid: false });
    }
});





export default router;
