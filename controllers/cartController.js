import { addToCart, getCartByWalletAddress, removeFromCart, clearCart } from "../models/cartModel.js";

// Add to Cart
export const addNFTToCart = async (req, res) => {
  try {
    const { walletAddress, nftId, contractAddress, quantity = 1 } = req.body;
    
    // Ensure the nftId is a number
    if (typeof nftId !== "number") {
      res.status(400).json({ error: "nftId must be a number" });
      return; // Explicitly return to stop further execution
    }

    const cartItem = await addToCart({
      walletAddress,
      nftId,
      contractAddress,
      quantity,
    });

    res.status(201).json(cartItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get user's cart
export const getUserCart = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const cart = await getCartByWalletAddress(walletAddress);
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove an NFT from cart
export const removeNFTFromCart = async (req, res) => {
  try {
    const { walletAddress, nftId, contractAddress } = req.params;
    
    // Ensure the nftId is a number
    if (typeof nftId !== "string" || isNaN(Number(nftId))) {
      res.status(400).json({ error: "nftId must be a number" });
      return; // Explicitly return to stop further execution
    }

    await removeFromCart(walletAddress, Number(nftId), contractAddress);

    res.status(200).json({ message: "Removed from cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear entire cart
export const clearUserCart = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    await clearCart(walletAddress);
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
