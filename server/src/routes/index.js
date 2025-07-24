const express = require("express");
const router = express.Router();
const { getBalance } = require("../../services/flowService");
const authMiddleware = require("../auth/authMiddleware"); // you likely have this

// GET /api/user/balance
router.get("/user/balance", authMiddleware, async (req, res) => {
  try {
    const flowAddress = req.user.flowAddress; // This comes from JWT payload

    if (!flowAddress) {
      return res.status(400).json({ message: "Missing Flow address" });
    }

    const balance = await getBalance(flowAddress);
    res.json({ balance });
  } catch (err) {
    console.error("Failed to fetch user balance", err);
    res.status(500).json({ message: "Failed to fetch balance" });
  }
});

router.post("/auth/login", login); // client will hit this with Magic token


module.exports = router;
