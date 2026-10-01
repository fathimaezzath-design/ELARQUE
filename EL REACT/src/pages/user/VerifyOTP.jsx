import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OTPInput from "../../components/auth/OTPInput";
import { verifyOTP, resendOTP } from "../../authService";
import bg from "../../assets/images/Signup.png";

function VerifyOTP() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const email = state?.email || "swaliha@example.com";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [time, setTime] = useState(45);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Poppins:wght@300;400;500;600&display=swap');

      *{
        margin:0;
        padding:0;
        box-sizing:border-box;
      }

      body{
        font-family:'Poppins',sans-serif;
      }

      .verify-page{
        min-height:100vh;
        background-size:cover;
        background-position:center;
        display:flex;
        justify-content:center;
        align-items:center;
        position:relative;
        padding:30px;
      }

      .overlay{
        position:absolute;
        inset:0;
        background:rgba(32,8,6,.45);
        backdrop-filter:blur(5px);
      }

      .verify-card{
        position:relative;
        z-index:2;
        width:540px;
        background:#F8F3EC;
        border-radius:30px;
        padding:42px;
        text-align:center;
        box-shadow:0 30px 70px rgba(0,0,0,.35);
      }

      .logo{
        color:#6B1424;
        font-family:'Cormorant Garamond',serif;
        font-size:36px;
        letter-spacing:6px;
      }

      .sub{
        color:#8A6232;
        font-style:italic;
        font-family:'Cormorant Garamond',serif;
        margin-top:5px;
        font-size:22px;
      }

      .line{
        color:#B08A42;
        font-size:11px;
        letter-spacing:3px;
        margin-top:10px;
      }

      hr{
        border:none;
        height:1px;
        background:#E5D8C5;
        margin:28px 0;
      }

      h2{
        font-family:'Cormorant Garamond',serif;
        font-size:42px;
        color:#222;
        margin-bottom:10px;
      }

      .desc{
        color:#666;
        font-size:16px;
        line-height:24px;
      }

      .email{
        color:#6B1424;
        font-weight:600;
        margin-top:8px;
        display:block;
      }

      .badge{
        display:inline-block;
        margin-top:18px;
        border:1px solid #D9C9B6;
        border-radius:30px;
        padding:10px 18px;
        color:#9B7A3E;
        font-size:11px;
        letter-spacing:2px;
      }

      .otp-container{
        display:flex;
        justify-content:center;
        gap:12px;
        margin:35px 0;
      }

      .otp-box{
        width:52px;
        height:62px;
        border:1px solid #D8CFC4;
        border-radius:16px;
        background:#FFFDFB;
        text-align:center;
        font-size:30px;
        font-weight:600;
        color:#6B1424;
        outline:none;
      }

      .otp-box:focus{
        border:2px solid #6B1424;
        box-shadow:0 0 0 3px rgba(107,20,36,.12);
      }

      .otp-footer{
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:28px;
        font-size:14px;
      }

      .timer{
        color:#6F5A44;
      }

      .resend{
        background:none;
        border:none;
        color:#8E8E8E;
        letter-spacing:2px;
        cursor:pointer;
      }

      .resend:disabled{
        cursor:not-allowed;
        opacity:.5;
      }

      .verify-btn{
        width:100%;
        padding:18px;
        border:none;
        border-radius:40px;
        background:linear-gradient(90deg,#7B1E2B,#5A0014);
        color:white;
        font-size:15px;
        font-weight:600;
        letter-spacing:3px;
        cursor:pointer;
      }

      .verify-btn:hover{
        transform:translateY(-2px);
        box-shadow:0 10px 25px rgba(123,30,43,.4);
      }

      .bottom-link{
        margin-top:35px;
        color:#666;
        font-size:15px;
        cursor:pointer;
      }

      .help{
        margin-top:22px;
        color:#8A6A3E;
        font-size:13px;
      }

      @media(max-width:600px){

        .verify-card{
          width:100%;
          padding:28px;
        }

        h2{
          font-size:34px;
        }

        .otp-box{
          width:46px;
          height:56px;
          font-size:24px;
        }

      }
    `;

    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    try {
      setLoading(true);

      const res = await verifyOTP({
        email,
        otp: otp.join(""),
      });

      localStorage.setItem("token", res.data.token);

      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP({ email });
      setTime(45);
      alert("OTP sent successfully.");
    } catch {
      alert("Unable to resend OTP.");
    }
  };

  return (
    <div
      className="verify-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="overlay"></div>

      <div className="verify-card">

        <div className="logo">ELARQUE</div>

        <div className="sub">Luxury Western Fashion</div>

        <div className="line">
          TIMELESS ELEGANCE • MODERN CONFIDENCE
        </div>

        <hr />

        <h2>Verify Your Account</h2>

        <p className="desc">
          We have sent a 6-digit atelier code to
        </p>

        <span className="email">{email}</span>

        <div className="badge">
          ● ENCRYPTED ATELIER TOKEN • EXPIRES IN 10 MIN
        </div>

        <OTPInput
          otp={otp}
          setOtp={setOtp}
        />

        <div className="otp-footer">

          <span className="timer">
            ⏱ Resend in 00:{String(time).padStart(2, "0")}
          </span>

          <button
            className="resend"
            onClick={handleResend}
            disabled={time > 0}
          >
            RESEND CODE
          </button>

        </div>

        <button
          className="verify-btn"
          onClick={handleVerify}
        >
          {loading ? "VERIFYING..." : "VERIFY ACCOUNT →"}
        </button>

        <div
          className="bottom-link"
          onClick={() => navigate("/signup")}
        >
          ← Back to Sign Up
        </div>

        <div className="help">
          🎧 Having trouble? Contact Haute Concierge
        </div>

      </div>

    </div>
  );
}

export default VerifyOTP;