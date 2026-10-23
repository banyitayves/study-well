# Study Space

A student study website built with React 19, Tailwind CSS 4, Vite, Express 5, Node.js, and MySQL 8.4.

Students can create an account, explore subjects and notes, take quizzes, and track their study activity.

## Requirements

- Windows 10/11
- Node.js 20.19+ and npm
- MySQL Server 8.4

## Getting started

1. Create a MySQL database and application user (or use an existing local MySQL account):

   ```sql
   CREATE DATABASE learning_space CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE USER 'learning_app'@'127.0.0.1' IDENTIFIED BY 'change-this-password';
   GRANT ALL PRIVILEGES ON learning_space.* TO 'learning_app'@'localhost';
   ```

2. Copy `.env.example` to `.env` and set the database credentials and a long random `JWT_SECRET`.
3. Install dependencies and create the tables and starter study content:

   ```powershell
   npm install
   npm run db:setup
   ```

4. Start the API and website:

   ```powershell
   npm run dev
   ```

5. Open <http://localhost:5173> and create a student account.

The starter library includes Mathematics, Biology, Physics, Chemistry, and English content. The first account is created through the registration form; there is no shared demo password.

## Production

Run `npm run build` to build the frontend. Serve `frontend/dist` from a static host and run `npm start` for the API. Configure the production host to route `/api/*` to the API server, and set the environment variables from `.env.example`.
