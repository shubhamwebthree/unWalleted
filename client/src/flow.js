import { config } from "@onflow/fcl";

config({
  "app.detail.title": process.env.REACT_APP_FLOW_APP_TITLE || "unWalleted",
  "app.detail.icon": "https://i.imgur.com/vM4Jv2A.png", // Replace with your app's icon
  "accessNode.api": process.env.REACT_APP_FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org",
  "discovery.wallet": process.env.REACT_APP_FLOW_DISCOVERY_WALLET || "https://fcl-discovery.onflow.org/testnet/authn",
});

