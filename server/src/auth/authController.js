const jwt = require("jsonwebtoken");
const axios = require("axios");
const { User } = require("../db/db");

const MAGIC_SECRET_KEY = process.env.MAGIC_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

const validateMagicUser = async (didToken) => {
  const response = await axios.get("https://api.magic.link/v1/user/get", {
    headers: {
      Authorization: `Bearer ${didToken}`,
      "X-Magic-Secret-Key": MAGIC_SECRET_KEY,
    },
  });
  return response.data;
};

exports.login = async (req, res) => {
  const didToken = req.headers.authorization?.replace("Bearer ", "");

  if (!didToken) {
    return res.status(401).json({ message: "Missing DID token" });
  }

  try {
    const magicUser = await validateMagicUser(didToken);

    // 🔁 Upsert user in DB
    const user = await User.findOneAndUpdate(
      { email: magicUser.email },
      {
        email: magicUser.email,
        issuer: magicUser.issuer,
        flowAddress: magicUser.publicAddress || "0xPLACEHOLDER",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ✅ Create your session token
    const sessionToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        flowAddress: user.flowAddress,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        flowAddress: user.flowAddress,
      },
      sessionToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ message: "Login failed" });
  }
};
