# exam-platform
# Smart Exam Preparation Platform

## Features
- JWT Authentication
- Role-based access (Student, Teacher, Admin)
- Quiz System (coming next)
- Notes System (planned)

## Tech Stack
- Node.js
- Express.js
- MongoDB
- JWT

## Setup Instructions
1. Clone repo
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

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
