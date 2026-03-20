const express = require("express");
const { askQuestion, getMetrics, getHistory } = require("../controllers/tutorController");

const router = express.Router();

router.post("/ask", askQuestion);
router.get("/metrics", getMetrics);
router.get("/history", getHistory);

module.exports = router;
