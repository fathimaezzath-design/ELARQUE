const Address = require("../models/Address");

//ADD ADDRESS
const addAddress = async (req, res) => {
  try {
    const { fullName, phone, house, street, city, state, pincode } = req.body;

    if (
      !fullName ||
      !phone ||
      !house ||
      !street ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All address fields are required",
      });
    }

    const hasDefault = await Address.findOne({
      userId: req.user.userId,
      isDefault: true,
    });

    const address = await Address.create({
      userId: req.user.userId,
      fullName,
      phone,
      house,
      street,
      city,
      state,
      pincode,
      isDefault: !hasDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//GET ADDRESSES
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      userId: req.user.userId,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//UPDATE ADDRESS 
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, house, street, city, state, pincode } = req.body;

    const address = await Address.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.userId,
      },
      {
        fullName,
        phone,
        house,
        street,
        city,
        state,
        pincode,
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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//  DELETE ADDRESS
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//SET DEFAULT ADDRESS
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      { userId: req.user.userId },
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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
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