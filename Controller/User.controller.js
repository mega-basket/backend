import User from "../Model/Users.model.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt, { decode } from "jsonwebtoken";
import { Address } from "../Model/AddressSchema.model.js";
const tokenBlacklist = new Set();
const register = async (req, res) => {
  const {
    name,
    userName,
    email,
    password,
    city,
    addresses,
    phone,
    state,
    street,
    country,
    postalCode,
  } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400).json({
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
      addresses,
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

    user.addresses = newAddress;

    await user.save();
    res.status(200).json({
      message: "User created Successfully",
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
  const pageNum = Number(page) || 1 
  const pageSize = Number (limit) || 10
  const skip = (pageNum -1 ) * pageSize

  try {

    let query = {}
    if (search) {
      query = {
        $or: [
          {name: {$regex: search, $options: 'i'}},
          {email: {$regex: search, $options: 'i'}}
        ]
      }
    }
    const user = await User.find(query)
    .skip(skip)
    .limit(pageSize).
    select('-password')
    .populate("addresses");

    const totalUser = await User.countDocuments(query)
    res.status(200).json({
      message: "User fetched Succesfully",
      success: true,
      user,
      pagination:{
        totalUser,
        currentPage: pageNum,
        totalPages: Math.ceil(totalUser / pageSize),
        pageSize
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to user fetch",
      error: error.message
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Make sure this matches your middleware
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },  // ✅ using "userId"
      process.env.JWT_SECRET,
      { expiresIn: "130m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },  // ✅ using "userId"
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // ✅ Only secure in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const profile = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT

    const user = await User.findById(userId)
      .select("-password")
      .populate("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

const editUser = async (req, res) => {
  const {id} = req.params
  const {name, email, phone} = req.body

  try {
    const user = await User.findById(id)

    if(!user) {
      res.status(404).json({
        message:"User not found"
      })
    }

    const updateUser = await User.findByIdAndUpdate(id, {
      name,
      email,
      phone
    },
  {new: true})

  if (!updateUser) {
    res.status(404).json({
      success: false,
      message: "User not found"
    })
  }

  res.status(200).json({
    success: true,
    message:"User updated successfully",
    updateUser
  })

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
}

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(403).json({
      message: "Refresh token expired",
    });
  }
};


const logout = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];

    // Optional blacklist (only if token exists)
    if (token) {
      tokenBlacklist.add(token);
    }

    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  }
};



export { register,refreshToken, getUser, login, profile, editUser, logout };
