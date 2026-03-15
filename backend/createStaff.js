// to create Owner and Staff users

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voyagego';

// User schema — must include OWNER and STAFF in the enum
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: {
    type: String,
    enum: ['CUSTOMER', 'DRIVER', 'ADMIN', 'OWNER', 'STAFF'],
    default: 'CUSTOMER'
  },
  licenseNo: { type: String },
  languages: [{ type: String }],
  vehicleSpecialization: [{ type: String }],
  isDriverVerified: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  shiftStart: { type: String },
  shiftEnd: { type: String },
  permanentAddress: String,
  temporaryAddress: String
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);


const accounts = [
  {
    name:     'System Owner',
    email:    'owner@gmail.com',   
    password: 'owner1234',           
    phone:    '9800000001',
    role:     'OWNER',
  },
  {
    name:     'Staff Member',
    email:    'staff@gmail.com', 
    password: 'staff1234',         
    phone:    '9800000002',
    role:     'STAFF',
  },
];

async function createAccounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    for (const account of accounts) {
      // Check if already exists
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        console.log(`✗ Already exists — ${account.role}: ${account.email}`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(account.password, salt);

      // Create user
      const created = await User.create({ ...account, password: hashedPassword });

      console.log(`✓ ${created.role} created successfully!`);
      console.log('──────────────────────────────────');
      console.log('Email:   ', created.email);
      console.log('Password:', account.password, '(use this to login)');
      console.log('Role:    ', created.role);
      console.log('──────────────────────────────────\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createAccounts();