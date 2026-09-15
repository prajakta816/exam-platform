# Exam Platform Architecture and Flow Documentation

## 1. Database Design (MongoDB / Mongoose)

This project uses **MongoDB**, a NoSQL document database. Traditional relational database concepts map as follows:
*   **Tables** -> **Collections**
*   **Primary Keys** -> **`_id`** (an automatically generated `ObjectId`)
*   **Foreign Keys** -> **References (`ref`)** to other documents using their `_id`.

### Core Collections

*   **User Collection:** Stores students, teachers, and admins. Tracks XP, level, badges, and social following.
    *   *References:* `followers`, `following`, `followRequests` (all referencing User).
*   **Quiz Collection:** Stores test details, questions, options, timers, and difficulty levels.
    *   *References:* `createdBy` (User).
*   **Room Collection:** Manages live, real-time quiz sessions.
    *   *References:* `quizId` (Quiz), `teacherId` / `teacher` (User), `students.userId` (User).
*   **TestResult Collection:** Records a student's final score and performance after completing a live room quiz.
    *   *References:* `studentId` (User), `quizId` (Quiz).
*   **Attempt Collection:** Logs individual, standard quiz attempts with scores and feedback.
    *   *References:* `user` (User), `quiz` (Quiz).
*   **Battle Collection:** Manages 1v1 competitive quiz battles.
    *   *References:* `challenger` (User), `opponent` (User), `quiz` (Quiz), `winner` (User).
*   **Note Collection:** Manages uploaded study materials (free or paid).
    *   *References:* `uploadedBy` (User), `accessedBy` (User array).

### System Collections

*   **ChatHistory Collection:** Logs AI Chat interactions regarding specific notes.
    *   *References:* `user` (User), `noteId` (Note).
*   **Activity Collection:** Logs social feed events (e.g., uploading notes, scoring high).
    *   *References:* `user` (User).
*   **Notification Collection:** Stores alerts for users.
    *   *References:* `user` (Receiver), `sender` (Triggered the alert).
*   **Comment & Rating Collections:** Handle user feedback via a Polymorphic Design.
    *   *References:* `user` (User), `targetId` (Dynamic reference to either a Quiz or a Note).

---

## 2. Platform User Flow

### A. Onboarding & Authentication
1.  **Registration (`/register`):** User signs up and is assigned a role (Student/Teacher).
2.  **Verification (`/verify-email/:token`):** User enters an OTP sent to their email to activate the account.
3.  **Login (`/login`):** User logs in and receives a JWT token.

### B. Core Workflows (Post-Login)
1.  **Standard Quizzing:** 
    *   Teachers/Users create quizzes (`/create-quiz`). 
    *   Students take the quiz (`/quiz/:id`), view their rank (`/rank/:id`), and check history/analytics (`/history`, `/analytics`).
2.  **Live Quizzing (Synchronous):** 
    *   Teachers host live sessions (`/live-dashboard`). 
    *   Students join via a room code (`/live-join`) and take the test in sync (`/live-room/:roomCode`).
3.  **Study Materials & AI:** 
    *   Users download/upload notes (`/notes`). 
    *   They can generate flashcards (`/flashcards/:noteId`) or chat with an AI tutor about the note (`/chat-tutor/:noteId`).
4.  **Gamification & Battles:** 
    *   Users earn XP and badges (`/gamification`). 
    *   They challenge peers to 1v1 battles (`/battle/:battleId`).
5.  **Social Connectivity:** 
    *   Users view profiles (`/profile/:userId`), send follow requests, and view the global activity feed (`/board`).

---

## 3. JWT Implementation in Registration & Login

JSON Web Tokens (JWT) are used to securely transmit information between the client (frontend) and the server (backend) as a JSON object. Here is exactly how it is implemented in this project:

### Step 1: Registration (No JWT Yet)
When a user registers (`POST /api/auth/register`), the server creates their account in the database but sets `isVerified: false`. It generates a 6-digit OTP and emails it to the user. **No JWT is issued at this stage** because the email hasn't been verified.

### Step 2: OTP Verification & JWT Issuance
When the user submits their OTP (`POST /api/auth/verifyOtp`), the server verifies it. If correct:
1.  The user's `isVerified` flag is set to `true`.
2.  The server generates a JWT using `jsonwebtoken`:
    ```javascript
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    ```
    *   **Payload:** Contains the user's `_id` and `role`. This allows the backend to know *who* is making a request and *what permissions* they have without querying the DB every time.
    *   **Signature:** Signed with `JWT_SECRET` so the token cannot be forged by the client.
    *   **Expiry:** The token is valid for 7 days.
3.  The server sends this `token` back to the frontend.

### Step 3: Standard Login
When a verified user logs in (`POST /api/auth/login`), the server compares their hashed password using `bcrypt`. If correct, the server generates a new JWT (same logic as Step 2) and sends it to the frontend.

### Step 4: Accessing Protected Routes
The frontend stores this JWT (typically in `sessionStorage`). Whenever the frontend requests a protected route (e.g., creating a quiz, fetching the dashboard), it attaches the JWT in the HTTP headers:
`Authorization: Bearer <the_jwt_token>`

The backend uses an `authMiddleware` to verify the token:
1. Extracts the token from the header.
2. Calls `jwt.verify(token, JWT_SECRET)` to ensure it hasn't been tampered with or expired.
3. Decodes the payload, fetches the User from the database, and attaches it to `req.user`.
4. Allows the request to proceed to the controller.

---

## 4. OTP and Email Verification Logic (Technical Deep Dive)

The OTP and email verification logic is implemented using the built-in `crypto` module in Node.js and the `nodemailer` library. Here is a step-by-step breakdown of how it functions under the hood:

### Phase 1: Generating the OTP (Registration)
When a user submits their registration details, the server needs to generate a secure OTP before saving the user to the database.

*   **Cryptographic Security:** Instead of using `Math.random()` (which is predictable and not secure), the application uses `crypto.randomInt(100000, 999999)`. This relies on the operating system's underlying random number generator, ensuring the 6-digit OTP is secure against guessing attacks.
*   **Expiration Tracking:** The OTP must have a strict lifespan. The server calculates an expiration timestamp set to 15 minutes from the current time (`Date.now() + 15 * 60 * 1000`).
*   **Database Storage:** The user is saved to MongoDB with an `isVerified: false` status, along with the `verificationOtp` and `verificationOtpExpires` values stored directly in their user document.

### Phase 2: Sending the Email
Immediately after the user is saved, an asynchronous process is triggered to deliver the OTP.

*   **Nodemailer Transporter:** A utility function (`sendEmail.js`) initializes a `nodemailer.createTransport()`. It connects to an SMTP service (e.g., Gmail) using credentials securely loaded from environment variables (`EMAIL_USER` and `EMAIL_PASS`).
*   **Dynamic Template:** The email is constructed using an HTML string that dynamically injects the generated OTP, providing a clean and formatted message to the user.
*   **Error Handling:** The email dispatch is wrapped in a `try-catch` block. If the email fails to send (e.g., due to network issues), the user is still created in the database, allowing them to use a "Resend OTP" endpoint later without encountering a "User already exists" error.

### Phase 3: Validating the OTP
When the user retrieves the OTP from their email and submits it via the `/verifyOtp` endpoint, the server performs a strict validation process:

1.  **Lookup:** The user is queried in the database using their email address.
2.  **Redundancy Check:** The server checks if `user.isVerified` is already true to prevent unnecessary processing.
3.  **Strict Matching:** The provided OTP is strictly compared against the `verificationOtp` stored in the database.
4.  **Expiration Check:** The server verifies that the current time (`Date.now()`) is strictly less than the `user.verificationOtpExpires` timestamp. If it has expired, the request is rejected, and the user must request a new OTP.
5.  **State Update & Cleanup:** If all validations pass, the user's `isVerified` flag is updated to `true`. Crucially, the `verificationOtp` and `verificationOtpExpires` fields are set to `undefined` (or deleted) in the database. This prevents the OTP from ever being reused.
6.  **Auto-Login:** A JWT token is immediately generated and returned to the client, seamlessly logging the user in without requiring them to re-enter their password.

---

## 5. Frontend Registration & JWT Flow (React Perspective)

The frontend manages the user experience dynamically using React state and seamlessly injects JWT tokens using Axios Interceptors.

### Phase 1: Registration State Management (`Register.jsx`)
1.  **Form State:** The component maintains the form data (Name, Email, Password, Role) via a standard `useState` object.
2.  **Submit Registration:** On form submission, the `handleRegister` function sends a `POST /auth/register` request using the `API` service.
3.  **Dynamic UI Shift:** Upon a successful response, instead of redirecting the user immediately, the component toggles a boolean state: `setIsRegistered(true)`. This dynamically unmounts the registration form and mounts the OTP input UI in its place, creating a seamless single-page experience.

### Phase 2: OTP Verification & Token Storage
1.  **OTP Submission:** The user inputs the 6-digit OTP, which is tracked via its own `otp` state variable.
2.  **Validation Request:** The `handleVerifyOtp` function sends a `POST /auth/verify-otp` request containing the email and OTP.
3.  **Storing the JWT:** If the OTP is correct, the backend responds with a success message and the **JWT token**.
    *   The frontend instantly saves this token to browser storage: `sessionStorage.setItem("token", res.data.token);`.
4.  **Redirection:** After a brief delay (to show a success message), `navigate("/")` is called to route the user to the protected dashboard, followed by a `window.location.reload()` to update the global authentication state across the app.

### Phase 3: Global Axios Interceptor (`api.js`)
To ensure that all subsequent API calls are properly authenticated without having to manually add the token to every single request, the project uses an **Axios Interceptor**:

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach token automatically to EVERY request
API.interceptors.request.use((req) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;
```

**How it works:**
*   Before *any* request leaves the frontend (whether fetching quizzes or uploading a note), Axios pauses it.
*   It checks `sessionStorage` for a `token`.
*   If a token exists, it appends the `Authorization: Bearer <token>` header to the outgoing request.
*   The request then continues to the backend, fully authenticated.
