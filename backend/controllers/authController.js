import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Register with role
export const register = async (req, res) => {
  try {
    const { email, password, role, name, phone, licenseNo, permanentAddress, temporaryAddress } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user based on role
    const userData = {
      email,
      password: hashedPassword,
      name,
      phone,
      role: role.toUpperCase(), // CUSTOMER, DRIVER, ADMIN
      permanentAddress,
      temporaryAddress
    };
    
    // Add driver-specific fields if role is driver
    if (role === 'driver' || role === 'DRIVER') {
      userData.licenseNo = licenseNo;
      userData.isDriverVerified = false; // Admin needs to verify drivers
    }
    
    const user = await User.create(userData);
    
    // Generate JWT token
    const token = jwt.sign({ 
      email: user.email, 
      id: user._id, 
      role: user.role 
    }, process.env.JWT_SECRET || 'Alish');
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      message: 'Account created successfully'
    });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ token: null, message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ token: null, message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ 
      email: user.email, 
      id: user._id, 
      role: user.role 
    }, process.env.JWT_SECRET || 'Alish');
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      },
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user (me)
export const me = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Alish');
    const user = await User.findOne({ email: decoded.email }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Convert role to uppercase to match your frontend expectation
    user.role = user.role.toUpperCase();
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(403).json({ message: 'Invalid token' });
  }
};