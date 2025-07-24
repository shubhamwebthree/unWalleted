const fcl = require("@onflow/fcl");
const fs = require("fs");
const path = require("path");

// Reads and caches the Cadence script
const getBalanceScript = fs.readFileSync(
  path.resolve(__dirname, "../../token/cadence/scripts/get_balance.cdc"),
  "utf8"
);

async function getBalance(address) {
  try {
    const result = await fcl.query({
      cadence: getBalanceScript,
      args: (arg, t) => [arg(address, t.Address)],
    });

    return result; // UFix64 string, e.g., "10.00000000"
  } catch (error) {
    console.error("❌ Error querying Flow balance:", error);
    throw error;
  }
}

module.exports = {
  getBalance,
};
