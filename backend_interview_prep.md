# Backend Interview Preparation Guide

This document is designed to help you prepare for backend engineering interviews, covering core concepts, architectural decisions, and a practical implementation of JWT authentication.

---

## Part 1: Core Backend Concepts (Q&A)

### Q1. What is REST and what are its core principles?
**Answer:**
REST (Representational State Transfer) is an architectural style for designing networked applications. It relies on a stateless, client-server communication protocol, almost always HTTP.
*Core Principles:*
1.  **Client-Server:** Separation of concerns. The client handles the UI, and the server handles data and logic.
2.  **Stateless:** Every request from the client must contain all the information needed by the server to fulfill that request. The server does not store session state.
3.  **Cacheable:** Responses must define themselves as cacheable or not, to prevent clients from reusing stale data.
4.  **Uniform Interface:** Resources are manipulated through standardized representations (like JSON/XML) using standard HTTP methods (GET, POST, PUT, DELETE).

### Q2. What is the difference between SQL and NoSQL databases? When would you use which?
**Answer:**
*   **SQL (Relational):** Data is stored in structured tables with predefined schemas. Relationships are strictly enforced using Primary and Foreign Keys. *Example: MySQL, PostgreSQL.*
*   **NoSQL (Non-relational):** Data is stored in flexible formats like JSON documents, key-value pairs, or graphs. Schemas are dynamic. *Example: MongoDB, Redis.*
*   **When to use:** Use SQL when data integrity (ACID compliance) and complex relational querying are critical (e.g., financial systems). Use NoSQL when you need high scalability, rapid development with flexible schemas, or are handling unstructured data (e.g., social feeds, content management).

### Q3. How do you secure passwords in a database?
**Answer:**
Passwords should **never** be stored in plain text. They must be securely hashed and salted.
*   **Hashing:** A one-way mathematical function that converts a password into a fixed-length string. You cannot reverse a hash back to the original password.
*   **Salting:** Adding random data (a "salt") to the password *before* hashing. This protects against "rainbow table" attacks where hackers pre-compute hashes for common passwords.
*   *Implementation:* In Node.js, we typically use the `bcryptjs` library, which handles both generating the salt and hashing the password seamlessly.

### Q4. What is Middleware in Express.js?
**Answer:**
Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the `next` function in the application's request-response cycle. 
*   **Use cases:** Middleware can execute code, make changes to the request/response objects, end the request cycle (e.g., sending an error if a user isn't logged in), or call the `next()` function to pass control to the next middleware. Examples include logging, parsing JSON bodies (`express.json()`), or verifying JWT tokens.

### Q5. What is CORS and why is it important?
**Answer:**
CORS (Cross-Origin Resource Sharing) is a browser security feature. By default, web browsers block a web page from making AJAX requests to a different domain (origin) than the one that served the web page. CORS allows the backend server to specify exactly which origins (domains) are allowed to access its resources by setting specific HTTP headers.

---

## Part 2: JWT Authentication in a Main Server File

Below is a standalone `server.js` file demonstrating how to handle Registration and Login using JWTs.

### Prerequisites (What is Required)
To run this, you need the following NPM packages installed:
*   `express`: The web framework.
*   `mongoose`: To interact with MongoDB.
*   `bcryptjs`: To hash and salt passwords.
*   `jsonwebtoken`: To generate and verify tokens.
*   `dotenv`: To load environment variables (like the database URL and secret keys).

### The Code (`server.js`)

```javascript
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies

const JWT_SECRET = "super_secret_key_123"; // In a real app, use process.env.JWT_SECRET

// 1. Define the User Schema & Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);


// 2. REGISTER Endpoint
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // Save to Database
    const newUser = await User.create({ email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});


// 3. LOGIN Endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT Token
    // Payload contains the user ID. We sign it with our SECRET KEY.
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Send token to the frontend
    res.json({ token, message: "Login successful!" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 4. Start Server and Connect DB
mongoose.connect('mongodb://localhost:27017/auth_demo')
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => console.log("Server running on port 3000"));
  });
```

### Explanation: What, Why, and How

#### 1. What is a JWT?
JSON Web Token (JWT) is an open standard that defines a compact and self-contained way for securely transmitting information between parties as a JSON object. This information can be verified and trusted because it is digitally signed using a secret key.

A JWT consists of three parts separated by dots (`.`):
1.  **Header:** Indicates the token type (JWT) and the signing algorithm (e.g., HMAC SHA256).
2.  **Payload:** The claims or statements about an entity (usually the user), like their `id` or `role`. *Note: Anyone can decode the payload, so never put passwords here.*
3.  **Signature:** Created by taking the encoded header, encoded payload, and a secret key, and hashing them. This ensures the token hasn't been altered.

#### 2. Why use JWT?
*   **Statelessness:** Traditional session-based authentication requires the server to keep a record of logged-in users in memory or a database. JWTs are stateless; the server does not need to store the token. When a token is received, the server simply mathematically verifies the signature using its secret key.
*   **Scalability:** Because no session state is stored on the server, your application can easily scale across multiple servers (load balancers). Any server holding the `JWT_SECRET` can verify the token.
*   **Cross-Domain:** Tokens can easily be sent across different domains via HTTP headers.

#### 3. How the Code Works

**The Register Flow:**
1.  The client sends an `email` and `password`.
2.  The server verifies the email isn't already taken.
3.  The server uses `bcrypt.hash(password, 10)` to safely scramble the password. The `10` determines the complexity (salt rounds) of the hashing algorithm.
4.  The user is saved to the database with the *hashed* password, not the plain text one.

**The Login Flow:**
1.  The client sends an `email` and `password`.
2.  The server looks up the user by email.
3.  The server uses `bcrypt.compare()` to hash the incoming password and check if it matches the stored hash.
4.  If it matches, the server issues a JWT using `jwt.sign()`.
    *   The **Payload** is `{ id: user._id }`.
    *   The **Secret Key** is used to cryptographically sign it.
    *   The **Options** dictate that the token expires in 1 hour (`{ expiresIn: "1h" }`).
5.  The token is returned to the frontend. For all future requests to protected routes, the frontend will attach this token in the headers, and the backend will verify it using `jwt.verify(token, JWT_SECRET)`.
