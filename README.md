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
   CREATE USER 'learning_app'@'localhost' IDENTIFIED BY 'change-this-password';
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

## Teachers: upload quizzes

Set `ADMIN_EMAIL` to the teacher's account email and `ADMIN_SETUP_TOKEN` to a unique random secret of at least 24 characters in the backend environment. The teacher enters that code in the optional **Teacher setup code** field when registering or signing in with that email. Students leave it blank. The code is never shown in the app, and the quiz-management API checks the teacher role on the server. Keep both values private to the backend environment.

In **Manage quizzes**, create a quiz under a subject and download the CSV template. Fill one question per row with these columns:

```text
question,choice_a,choice_b,choice_c,choice_d,correct_answer,explanation
```

`correct_answer` must be `A`, `B`, `C`, or `D`. Uploading a replacement CSV replaces that quiz's existing question set. Draft quizzes are not shown to students until at least one question is uploaded. Students select answers, submit the quiz, and see their score and the explanations based on the teacher's answer key.

## Vercel deployment and TiDB Cloud

The repository includes a Vercel multi-service configuration for the Vite frontend and Express API. Configure these variables for the **backend service** in Vercel:

- `DB_HOST`: TiDB public endpoint hostname
- `DB_PORT`: `4000` for TiDB Cloud Starter / Essential public endpoints
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`: values from the TiDB Cloud **Connect** dialog
- `DB_SSL`: `true` (TiDB Cloud requires TLS)
- `JWT_SECRET`: a unique random value of at least 32 characters
- `ADMIN_EMAIL`: the teacher account email
- `ADMIN_SETUP_TOKEN`: a unique random teacher setup code of at least 24 characters

In TiDB Cloud, open **My TiDB → your instance → Connect**, choose the public endpoint and Node.js connection instructions. The shared endpoint username can include an account prefix; copy it exactly. Make sure the TiDB firewall allows connections from your Vercel deployment.

Apply the schema and starter lessons to the hosted database once from a machine that can reach the TiDB endpoint:

1. Copy `.env.example` to `.env`, then replace its values with the TiDB connection values, `DB_PORT=4000`, `DB_SSL=true`, a strong `JWT_SECRET`, `ADMIN_EMAIL`, and a unique `ADMIN_SETUP_TOKEN`.
2. Ensure your current public IP is allowed by the TiDB firewall.
3. Run `npm install` and `npm run db:setup`.
4. Add the same backend environment variables in Vercel and redeploy.

The API health endpoint is `/api/health`. It reports missing configuration, database connectivity, or schema setup problems without exposing credentials. For application errors, inspect the Vercel backend function logs.

## Production

Run `npm run build` to build the frontend. Serve `frontend/dist` from a static host and run `npm start` for the API. Configure the production host to route `/api/*` to the API server, and set the environment variables from `.env.example`.
