const fcl = require("@onflow/fcl");
const ec = require("elliptic").ec;
const sha3 = require("js-sha3");

const ecInstance = new ec("p256");
const PRIVATE_KEY = process.env.FLOW_PRIVATE_KEY;
const ADDRESS = process.env.FLOW_ADDRESS;

const sign = (messageHex) => {
  const key = ecInstance.keyFromPrivate(PRIVATE_KEY);
  const sig = key.sign(Buffer.from(messageHex, "hex"));
  const n = 32;
  return sig.r.toArrayLike(Buffer, "be", n).toString("hex") +
         sig.s.toArrayLike(Buffer, "be", n).toString("hex");
};

exports.authorization = async (account = {}) => {
  const address = ADDRESS.replace(/^0x/, "");
  return {
    ...account,
    addr: fcl.withPrefix(address),
    keyId: 0,
    signingFunction: async (signable) => ({
      addr: fcl.withPrefix(address),
      keyId: 0,
      signature: sign(signable.message),
    }),
  };
};
