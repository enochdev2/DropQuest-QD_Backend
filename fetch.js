import { Connection, PublicKey } from "@solana/web3.js";
import { Liquidity, MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";

const RPC = "https://api.mainnet-beta.solana.com"; // Or use Helius/Shyft for faster RPC
const connection = new Connection(RPC);

const POOL_ID = new PublicKey("6cirqvZtur4UKJcwLttzPtomCFADhDPhfzEsoJ9CUuEq");

async function fetchPoolPrice() {
  try {
    // Fetch all pool keys
    const allPools = await Liquidity.fetchAllPoolKeys(connection, {
      4: MAINNET_PROGRAM_ID.AmmV4,
      5: MAINNET_PROGRAM_ID.AmmV5,
    });

    // Find your pool by ID
    const poolKeys = allPools.find((p) => p.id.equals(POOL_ID));
    if (!poolKeys) {
      console.log("❌ Pool not found in Raydium SDK list");
      return;
    }

    // Fetch on-chain pool info
    const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

    console.log("✅ Pool price:", poolInfo.poolPrice.toString());
  } catch (err) {
    console.error("❌ Error fetching pool price:", err);
  }
}

fetchPoolPrice();
