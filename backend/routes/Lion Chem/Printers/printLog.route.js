// backend/routes/printLog.route.js
const express = require("express");
const router = express.Router();

router.post("/log", async (req, res) => {
  try {
    const { jobId, user, status, printer, timestamp } = req.body;
    console.log("Print log:", { jobId, user, status, printer, timestamp });
    // Optional: save to DB here
    return res.json({ success: true });
  } catch (e) {
    console.error("Print log error:", e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
