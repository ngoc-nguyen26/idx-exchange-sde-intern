const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET /api/health
router.get("/", async (req, res) => {
  try {

    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

module.exports = router;