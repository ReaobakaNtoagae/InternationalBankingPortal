**International Payments & Employee Portal**

This project is a React frontend with a Node.js / Express backend for secure international payments and employee management.
Users can securely log in and perform payment-related operations, while employees can manage, approve, and track payments.
The app enforces strong security measures such as input validation, hashed credentials, JWT authentication, and rate limiting.

**Project Overview
Frontend**

Built with React, featuring:

Login interface for authenticated access.

Payment and transaction forms.

Employee portal with payment management (view, approve, reject, and monitor transactions).

Clean, responsive UI with role-based access.

**Backend**

Powered by Node.js + Express + MongoDB:

Handles authentication and payment processing.

Implements input validation and sanitization.

Enforces role-based access for employees and users.

**Security**

Robust, multi-layered security system including:

Input sanitization (XSS protection).

Password hashing (bcrypt).

JWT authentication.

Rate limiting & Helmet headers.

HTTPS enforcement in production.

**Project Structure**
/banking-api         -> Backend API (Node.js + Express + MongoDB)
/models              -> Mongoose models (User.js, Payment.js)
/routes              -> API routes (authRoutes.js, paymentRoutes.js)
/middleware           -> Authentication & security middleware
/src                  -> React frontend components
/public               -> Static frontend files

**How the App Works**
**Login**

Customers or employees log in using their account number, password, and full name.

The backend verifies credentials using bcrypt.

A JWT token is issued upon successful authentication.

Token is used to access protected routes (like payment or employee operations).

**Payments**

Authenticated customers can create and track international payments.

All payment inputs (amounts, recipient accounts, etc.) are validated and sanitized.

Payments are protected against XSS, injection, and DDoS attacks.

Employee accounts can approve, reject, or view pending payments.

**Employee Portal**

Employees can log in and access additional routes:

View all submitted, pending, or rejected payments.

Approve or reject transactions.

Submit payments to SWIFT

Only authenticated employees with valid JWT tokens have access.

**Security Measures & Checklist
Security Point	Implementation**
Password security (hashing & salting): 
Passwords hashed with bcrypt before storage. Login compares hashes.

Input whitelist (RegEx validation): 
Backend validates full name, account number, and payment data using strict patterns. It also validates input for transaction forms before submission. 

Traffic over SSL	Enforced in production via redirect to HTTPS in server.js using x-forwarded-proto header.

Protection against common attacks	Helmet headers for CSP, HSTS, X-Frame-Options, XSS; rate limiting; CORS whitelist; JWT authentication; and safe error handling.

Sanitization & validation	All user and payment inputs sanitized with xss and validated before database interaction.

**Setup Instructions (Local Development)**
Clone the repository
git clone <repo-url>
cd InternationalPaymentsPortal

**Install dependencies**
npm install
cd banking-api
npm install

**Run backend server**
Run node server.js in banking-api

**Run frontend**
Run npm start in InternationalPaymentsPortal
Login with information from seedUsers.js
Use separate terminals

**Access the app**

**Visit:**
http://localhost:3000

**Security Highlights**

JWT tokens secure user sessions; expire daily.

Rate limiting mitigates DDoS & brute-force attacks.

Helmet applies secure HTTP headers (CSP, HSTS, X-Frame-Options).

Strict input validation blocks malicious or malformed data.

Error handling ensures sensitive details are never leaked.

XSS sanitization (xss npm module) applied to all inputs.

**Summary
Role	Capabilities**
Customer : 	Log in, create and view international payments
Employee: Log in, view submitted payments, approve/reject transactions, submit payments to SWIFT, monitor payment history

System	Secure authentication, encrypted storage, input sanitization, and safe API access
