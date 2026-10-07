import { Routes, Route } from "react-router-dom";

import Home from "../components/home/Home";
import Login from "../components/auth/Login";
import Signup from "../components/auth/Signup";
import VerifyOTP from "../components/auth/VerifyOTP";
import ForgotPassword from "../components/auth/ForgotPassword";
import VerifyResetOTP from "../components/auth/VerifyResetOTP";
import ResetPassword from "../components/auth/ResetPassword";
import Profile from "../components/auth/Profile";
import EditProfile from "../components/auth/EditProfile";
import EditEmail from "../components/auth/EditEmail";
import VerifyEmail from "../components/auth/VerifyEmail";
import EmailVerified from "../components/auth/EmailVerified";
import Addresses from "../components/auth/Addresses";
import ChangePassword from "../components/auth/ChangePassword";

function UserRoutes() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/verify-otp" element={<VerifyOTP />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      <Route path="/edit-email" element={<EditEmail />}/>
      <Route path="/verify-email" element={<VerifyEmail />}/>
      <Route path="/email-verified" element={<EmailVerified />}/>
      
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="/change-password" element={<ChangePassword />} />
    </Routes>
  );
}

export default UserRoutes;