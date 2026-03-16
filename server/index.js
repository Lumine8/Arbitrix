const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Enable CORS for frontend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

// In-memory user store (for demo purposes)
let users = [];

// Helper to find user by email
const findUserByEmail = (email) => users.find(user => user.email === email);

// Helper to find user by username
const findUserByUsername = (username) => users.find(user => user.username === username);

// Yahoo Finance proxy endpoint
app.get("/api/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Yahoo Finance API error: ${response.status}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

// Claude AI proxy endpoint
app.post("/api/ai", async (req, res) => {
  try {
    const { system, user, maxTokens } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens || 800,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: `Claude API error: ${errorData.error?.message || "Unknown error"}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error calling Claude API:", error);
    res.status(500).json({ error: "Failed to call Claude API" });
  }
});

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, capital } = req.body;

    // Check if user already exists
    if (findUserByEmail(email) || findUserByUsername(username)) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      capital: capital || 0,
      createdAt: new Date(),
    };

    users.push(newUser);

    const payload = {
      user: {
        id: newUser.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1d" });
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1d" });
    res.json({ token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/api/auth/me", async (req, res) => {
  // For demo, we'll get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    const user = users.find(u => u.id === decoded.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});