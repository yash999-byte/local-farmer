const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Cloud Database
const dbURI = process.env.MONGODB_URI;
if (dbURI) {
    mongoose.connect(dbURI)
        .then(() => console.log('✅ Connected to MongoDB Database!'))
        .catch((err) => console.error('❌ Database connection error:', err));
} else {
    console.log('⚠️ MONGODB_URI environment variable is not set.');
}

// ----------------------------------------
// DATABASE STRUCTURES (SCHEMAS)
// ----------------------------------------

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'farmer', 'admin'], default: 'buyer' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Product Schema (NEW!)
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    description: { type: String },
    farmerPhone: { type: String, required: true } // Links the product to the farmer who listed it
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);


// ----------------------------------------
// API ROUTES
// ----------------------------------------

// Home Test Route
app.get('/', (req, res) => {
    res.send('Local Farmer App Backend is Live & Connected!');
});

// 1. REGISTER ROUTE (Create Account)
app.post('/api/register', async (req, res) => {
    try {
        const { name, phone, password, role } = req.body;
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }
        const newUser = new User({ name, phone, password, role });
        await newUser.save();
        res.status(201).json({ success: true, message: 'Account created successfully!', user: newUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// 2. LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone, password });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid phone number or password' });
        }
        res.status(200).json({ success: true, message: 'Login successful!', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// 3. ADD PRODUCT ROUTE (NEW!)
app.post('/api/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.status(201).json({ success: true, message: 'Product successfully listed!', product: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// 4. GET ALL PRODUCTS ROUTE (NEW!)
app.get('/api/products', async (req, res) => {
    try {
        // Fetch all products from newest to oldest
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});