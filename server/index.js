const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
  initDatabase,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser,
  getAllProducts,
  createProduct,
  deleteProduct,
  getAllPlans,
  createPlan,
  deletePlan
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase().catch(err => console.error('Failed to init SQLite DB:', err));

// Password validation helper according to Brightloop spec:
// > 8 chars, at least 1 uppercase, 1 lowercase, 1 special character
function validatePassword(password) {
  if (!password || password.length <= 8) {
    return { valid: false, message: 'Password must be more than 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password)) {
    return { valid: false, message: 'Password must include at least one special character (!@#$%^&* etc.).' };
  }
  return { valid: true };
}

// Authentication Middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    try {
      const freshUser = await getUserById(decoded.id);
      if (!freshUser || !freshUser.is_active) {
        return res.status(403).json({ error: 'User account disabled or not found.' });
      }
      req.user = freshUser;
      next();
    } catch (e) {
      return res.status(500).json({ error: 'Server authentication lookup error.' });
    }
  });
}

// Admin only middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// --- Auth Routes ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        company_name: user.company_name,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal login error.' });
  }
});

// Register new customer account
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, company_name, phone } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.message });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser = await createUser({
      email,
      password,
      full_name,
      role: 'customer',
      company_name: company_name || '',
      phone: phone || ''
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

// Forgot / Reset password request
app.post('/api/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return res.json({ message: `If ${email} is registered, a password reset link has been dispatched.` });
    }

    res.json({ message: `A password reset link has been dispatched to ${email}.` });
  } catch (err) {
    res.status(500).json({ error: 'Error processing password reset.' });
  }
});

// Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// List all users (Staff & Admin)
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Unauthorized to view user directory.' });
  }
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Add new staff member (Admin only)
app.post('/api/users/staff', authenticateToken, requireAdmin, async (req, res) => {
  const { email, password, full_name, phone } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Full name, email, and temporary password are required.' });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.message });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newStaff = await createUser({
      email,
      password,
      full_name,
      role: 'staff',
      company_name: 'Brightloop Software Inc.',
      phone: phone || '',
      created_by: req.user.id
    });

    res.status(201).json({
      message: 'Staff member added successfully.',
      user: newStaff
    });
  } catch (err) {
    console.error('Add staff error:', err);
    res.status(500).json({ error: 'Failed to add staff member.' });
  }
});
// --- Products & Plans API (Scene 2: Launching a new plan) ---

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json({ products });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Create new product
app.post('/api/products', async (req, res) => {
  const { name, type, salesPrice, costPrice, notes, hasOdooVariant, odooPriceOffset, variants } = req.body;
  if (!name || salesPrice === undefined || costPrice === undefined) {
    return res.status(400).json({ error: 'Product name, sales price, and cost price are required.' });
  }

  try {
    const product = await createProduct({
      name,
      type: type || 'Software',
      salesPrice,
      costPrice,
      notes,
      hasOdooVariant,
      odooPriceOffset: odooPriceOffset || 560,
      variants: variants || []
    });
    res.status(201).json({ message: 'Product created successfully.', product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Get all plans
app.get('/api/plans', async (req, res) => {
  try {
    const plans = await getAllPlans();
    res.json({ plans });
  } catch (err) {
    console.error('Fetch plans error:', err);
    res.status(500).json({ error: 'Failed to fetch plans.' });
  }
});

// Create new plan
app.post('/api/plans', async (req, res) => {
  const { name, cost, frequency, minQuantity, startDate, endDate, autoCloseOnEnd, canCloseEarly, canPause, canRenew, description } = req.body;
  if (!name || cost === undefined || !frequency || !startDate || !endDate) {
    return res.status(400).json({ error: 'Plan name, cost, billing frequency, and dates are required.' });
  }

  try {
    const plan = await createPlan({
      name,
      cost,
      frequency,
      minQuantity: minQuantity || 1,
      startDate,
      endDate,
      autoCloseOnEnd: autoCloseOnEnd !== false,
      canCloseEarly: canCloseEarly !== false,
      canPause: canPause !== false,
      canRenew: canRenew !== false,
      description
    });
    res.status(201).json({ message: 'Plan launched successfully.', plan });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Failed to create plan.' });
  }
});

// Delete plan
app.delete('/api/plans/:id', async (req, res) => {
  try {
    await deletePlan(req.params.id);
    res.json({ message: 'Plan deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan.' });
  }
});

// Serve static frontend in production if built
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Brightloop SQLite (https://www.sqlite.org) Auth & Users API server listening on http://localhost:${PORT}`);
});
