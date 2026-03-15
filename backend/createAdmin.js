// createAdmin.js - Run this once to create an admin user
// Usage: node createAdmin.js

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voyagego';

// User schema (copy from your User model)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['CUSTOMER', 'DRIVER', 'ADMIN'], 
    default: 'CUSTOMER'
  },
  licenseNo: { type: String },
  languages: [{ type: String }],
  vehicleSpecialization: [{ type: String }],
  isDriverVerified: { type: Boolean, default: false },
  shiftStart: { type: String },
  shiftEnd: { type: String },
  permanentAddress: String,
  temporaryAddress: String
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// ────────────────────────────────────────────────────────────────────────────
// CREATE ADMIN FUNCTION
// ────────────────────────────────────────────────────────────────────────────
async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Admin details - CHANGE THESE VALUES
    const adminData = {
      name: 'Admin User',
      email: 'admin@gmail.com',        // ← CHANGE THIS
      password: 'admin123',                 // ← CHANGE THIS (will be hashed)
      phone: '1234567890',
      role: 'ADMIN'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('✗ Admin user already exists with this email.');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const admin = await User.create({
      ...adminData,
      password: hashedPassword
    });

    console.log('\n✓ Admin user created successfully!');
    console.log('──────────────────────────────────');
    console.log('Email:   ', admin.email);
    console.log('Password:', adminData.password, '(use this to login)');
    console.log('Role:    ', admin.role);
    console.log('──────────────────────────────────\n');

    process.exit(0);

  } catch (error) {
    console.error('✗ Error creating admin:', error.message);
    process.exit(1);
  }
}

// Run the script
createAdmin();