
# Smart Exam Preparation Platform

## 🚀 Features

### Week 1
- User Authentication (JWT)
- Role-based access (Student, Teacher, Admin)

### Week 2
- Create Quiz (Teacher)
- Generate Quiz from Text (Student)
- Attempt Quiz
- Auto Score Calculation
- Leaderboard System
- Quiz Attempt History

---

## 🛠 Tech Stack
- Node.js
- Express.js
- MongoDB
- JWT Authentication

---

## ⚙️ Setup Instructions

1. Clone the repository
2. Install dependencies
   npm install
3. Create .env file
4. Run server
   npm run dev
    *add script in package.jon
   "scripts": {
  "dev": "nodemon server.js",
  "start": "node server.js"
}

---

## 🔑 API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Quiz
- POST /api/quiz/create
- POST /api/quiz/generate
- POST /api/quiz/attempt/:quizId

### Attempt
- GET /api/attempt/history
- GET /api/attempt/leaderboard/:quizId

---

## 📊 Future Scope
- Notes system (public/private)
- Paid notes feature
- Follow system
- AI quiz generation
