International Payments Portal

This project is a React frontend with a Node.js / Express backend for secure international payments. Users can register, log in, and perform transactions while the app enforces strong security measures.

Project Overview

Frontend: React components handle registration, login, and transaction forms.

Backend: Node.js + Express API with MongoDB database, handling authentication, payment processing, and input validation.

Security: Strong measures including input validation, hashed passwords, JWT authentication, rate limiting, and HTTPS enforcement.

Project Structure
/banking-api         -> Backend API (Node.js + Express + MongoDB)
/models              -> Mongoose models (User.js, Payment.js)
/routes              -> API routes (authRoutes.js, paymentRoutes.js)
/middleware          -> Middleware for authentication & security
/src                  -> React frontend components
/public               -> Static frontend files

How the App Works

User Registration:

Users fill out a form with full name, ID number, account number, and password.

The frontend validates inputs using whitelist RegEx patterns.

Backend re-validates the input before saving.

Passwords are hashed and salted using bcrypt.

A JWT token is issued for the user session.

Login:

Users submit account number and password.

Backend verifies the password using bcrypt.

JWT token is issued on successful login for authenticated routes.

Payments:

Authenticated users can create international payments.

Backend validates all inputs (amounts, recipient account numbers) using strict patterns and type checks.

Payment operations are protected against SQL injection, XSS, and DDoS attacks.

Security Measures & Checklist
Security Point	Implementation
Password security (hashing & salting)	Passwords hashed with bcrypt before storage. Login compares hashes.
Input whitelist (RegEx validation)	Frontend & backend validate full name, ID number, account number, password, and payment inputs using strict RegEx patterns.
Traffic over SSL	Enforced in production via redirect to HTTPS in server.js using x-forwarded-proto header. Tested in deployed environment.
Protection against common attacks	- Helmet headers for CSP, HSTS, X-Frame-Options, XSS protection
- Rate limiting to prevent brute-force / DDoS
- CORS whitelist to control allowed origins
- JWT authentication for protected routes
- Error handling prevents sensitive data leaks
- Sanitization & type validation for all user inputs
Setup Instructions (Local Dev)

Clone the repository:

git clone <repo-url>
cd InternationalBankingPortal


Install dependencies:

npm install
cd banking-api
npm install


Create a .env file with the following:

MONGO_URI=<your-mongo-uri>
JWT_SECRET=<your-secret>
NODE_ENV=development
PORT=5000


Run backend server:

node server.js


Run frontend:

npm start


Visit http://localhost:3000
 to test.

Security Highlights

JWT tokens secure sessions; expire daily.

Rate limiting reduces DDoS & brute-force risks.

Helmet sets secure HTTP headers (CSP, X-Frame-Options, HSTS).

Input validation blocks malicious data using strict whitelist patterns.

Error handling prevents sensitive stack traces from leaking.
