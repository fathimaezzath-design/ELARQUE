const Address = require("../models/Address");

const getUserId = (req) => req.user?.id || req.user?._id || req.user?.userId;

// ADD ADDRESS
const addAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to manage addresses",
      });
    }

    const { fullName, phone, house, street, city, state, pincode } = req.body;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !house?.trim() ||
      !street?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    // Duplicate address check (same user, same address details)
    const existingAddress = await Address.findOne({
      userId,
      fullName: { $regex: new RegExp(`^${fullName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      phone: phone.trim(),
      house: { $regex: new RegExp(`^${house.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      street: { $regex: new RegExp(`^${street.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      city: { $regex: new RegExp(`^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      state: { $regex: new RegExp(`^${state.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      pincode: pincode.trim(),
    });

    if (existingAddress) {
      return res.status(400).json({
        success: false,
        message: "This exact address already exists in your address book.",
        address: existingAddress,
      });
    }

    const hasDefault = await Address.findOne({
      userId,
      isDefault: true,
    });

    const address = await Address.create({
      userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      house: house.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: !hasDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("ADD ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Server error while saving address",
    });
  }
};

// GET ADDRESSES
const getAddresses = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const addresses = await Address.find({
      userId,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("GET ADDRESSES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving addresses",
    });
  }
};

// UPDATE ADDRESS 
const updateAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const { fullName, phone, house, street, city, state, pincode } = req.body;

    const address = await Address.findOneAndUpdate(
      {
        _id: id,
        userId,
      },
      {
        fullName: fullName?.trim(),
        phone: phone?.trim(),
        house: house?.trim(),
        street: street?.trim(),
        city: city?.trim(),
        state: state?.trim(),
        pincode: pincode?.trim(),
      },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating address",
    });
  }
};

// DELETE ADDRESS
const deleteAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const address = await Address.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If deleted address was default, make the most recent remaining address default
    if (address.isDefault) {
      const remaining = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting address",
    });
  }
};

// SET DEFAULT ADDRESS
const setDefaultAddress = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      { userId },
      { isDefault: false }
    );

    // Make selected address default
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while setting default address",
    });
  }
};

module.exports = {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,  
};