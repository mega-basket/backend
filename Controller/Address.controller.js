import { Address } from "../Model/AddressSchema.model.js";
import User from "../Model/Users.model.js";

export const createAddress = async (req, res) => {
  const {
    fullName,
    phone,
    street,
    city,
    state,
    country,
    postalCode,
    addressType,
    isDefault,
  } = req.body;

  try {
    const userId = req.user.userId;

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "All required address fields must be filled",
      });
    }

    if (isDefault) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      userId,
      fullName,
      phone,
      street,
      city,
      state,
      country,
      postalCode,
      addressType,
      isDefault,
    });

    await User.findByIdAndUpdate(userId, {
      $push: { addresses: address._id },
    });

    res.status(200).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add address",
      error: error.message,
    });
  }
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user.userId;

  try {
    const address = await Address.findByIdAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true }
    );

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
};

export const getAddress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const addresses = await Address.find({ userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
      error: error.message,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const address = await Address.findOneAndDelete({
      _id: id,
      userId: userId,
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found or unauthorized",
      });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { addresses: id },
    });

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message,
    });
  }
};
