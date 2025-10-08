import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import CustomerPortal from "./components/CustomerPortal";
import BeneficiaryPayment from "./components/BeneficiaryPayment";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/beneficiary" element={<BeneficiaryPayment />} />


      </Routes>
    </Router>
  );
}

export default App;
