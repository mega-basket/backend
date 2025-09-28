import User from "../Model/Users.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Address } from "../Model/AddressSchema.model.js";

const register = async (req, res) => {
  const {
    name,
    userName,
    email,
    password,
    city,
    address,
    phone,
    state,
    street,
    country,
    postalCode,
  } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(404).json({
      message: "All fields are required!!",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User is Already exist.",
      });
    }
    const token = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      userName,
      email,
      password,
      address,
      phone,
    });
    user.verificationToken = token;

    const newAddress = await Address.create({
      userId: user._id,
      street,
      city,
      state,
      country,
      postalCode,
    });

    user.address = newAddress;

    await user.save();
    res.status(200).json({
      messgae: "User created Successfully",
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create user",
    });
  }
};

const getUser = async (req, res) => {
  const { search, limit, page } = req.query;

  try {
    const user = await User.find().populate("address");
    res.status(200).json({
      message: "User fetched Succesfully",
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to user fetch",
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email && !password) {
    res.status(404).json({
      message: "Invalid email or password",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("token ==> ", token);

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const profile = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).populate("address");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json({
      message: "User found Succesfully",
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: "User not found",
      success: false,
    });
  }
};

export { register, getUser, login, profile };
