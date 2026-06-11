const express = require("express");
const router = express.Router();

/**
 * GET /api/health
 * Basic health check for the API
 */
router.get("/", (req, res) => {
  res.json({ success: true, status: "ok" });
});

module.exports = router;
