const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { uploadTextbook, listTextbooks } = require("../controllers/uploadController");

const router = express.Router();

router.post("/upload", upload.single("pdf"), uploadTextbook);
router.get("/textbooks", listTextbooks);

module.exports = router;
