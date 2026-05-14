import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const PUBLIC_ROLES = ["CUSTOMER", "DRIVER"];

//REGISTER
export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      name,
      phone,
      licenseNo,
      permanentAddress,
      temporaryAddress,
    } = req.body;

    const normalizedRole = role ? role.toUpperCase() : "CUSTOMER";

    if (!PUBLIC_ROLES.includes(normalizedRole)) {
      return res.status(403).json({
        message: `Role '${normalizedRole}' cannot be created via registration. Contact your system administrator.`,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      email,
      password: hashedPassword,
      name,
      phone,
      role: normalizedRole,
      permanentAddress,
      temporaryAddress,
    };

    if (normalizedRole === "DRIVER") {
      userData.licenseNo = licenseNo;
      userData.isDriverVerified = false;
    }

    const user = await User.create(userData);

    const token = jwt.sign(
      { email: user.email, id: user._id, role: user.role },
      process.env.JWT_SECRET || "Alish",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
    if (!user) {
      return res
        .status(401)
        .json({ token: null, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ token: null, message: "Invalid credentials" });
    }

    const normalizedRole = user.role.toUpperCase();

    const token = jwt.sign(
      { email: user.email, id: user._id, role: normalizedRole },
      process.env.JWT_SECRET || "Alish",
      { expiresIn: "7d" },
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: normalizedRole,
        phone: user.phone,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//GET current user
export const me = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Alish");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ ...user.toObject(), role: user.role.toUpperCase() });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(403).json({ message: "Invalid token" });
  }
};

//GET All Customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: "CUSTOMER" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (error) {
    console.error("getAllCustomers error:", error);
    res.status(500).json({ message: "Server error fetching customers." });
  }
};
