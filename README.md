# International Payments Portal

This project is a **React frontend** with a **Node.js / Express backend** for secure customer international payments.

---

## Available Scripts

In the project directory, you can run:

- **`npm start`** – Run the frontend in development mode at [http://localhost:3000](http://localhost:3000).  
- **`npm run build`** – Build the frontend for production.

Runs the app in the development mode.\
Open [http://localhost:5000](http://localhost:5000) to view it in your browser.

## Project Structure

/banking-api → Backend API (Node.js + Express + MongoDB)
/models → Mongoose models (User.js, Payment.js)
/routes → API routes (authRoutes.js, paymentRoutes.js)
/middleware → Middleware for authentication and security
/public → Static frontend files
/src → React frontend components


---

## Ade-Eza: Protect Against All Attacks

The backend and frontend have been hardened to protect against common web and banking threats:

| Page/File                     | Threats Protected                     | How It’s Protected                                                                                       |
|-------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------------------|
| `server.js`                   | MITM, Clickjacking, DDoS, XSS        | Helmet headers, HSTS, X-Frame-Options, CSP, rate limiting, CORS whitelist, XSS sanitization, compression |
| `authMiddleware.js`           | Session hijacking, invalid access    | Validates JWT tokens, excludes passwords from requests, ensures only authenticated users can access protected routes |
| `authRoutes.js`               | SQL injection, XSS, brute-force login | Uses hashed & salted passwords, parameterized queries, input sanitization, login rate limiting, strict field validation (RegEx) |
| `paymentRoutes.js`            | SQL injection, XSS, DDoS, data tampering | Parameterized Mongoose queries, input sanitization with xss(), strict whitelist validation, rate limiting, numeric validation |
| MongoDB models (`User.js`, `Payment.js`) | Data integrity                      | Enforces schema types and required fields, limits DB access to necessary permissions only               |

### Additional Measures

- Passwords are **hashed and salted** using bcrypt.  
- All traffic is served over **HTTPS with HSTS**.  
- **JWT tokens** secure sessions; tokens expire daily.  
- Input fields are validated against **whitelist patterns** to block malicious data.  
- **Rate limiting** reduces the risk of DDoS attacks and brute-force attempts.  

---

## Security Highlights

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
