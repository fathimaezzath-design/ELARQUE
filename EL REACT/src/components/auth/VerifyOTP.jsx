import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOTP, resendOTP } from "../../services/authService";
import bg from "../../assets/images/Signup.png";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

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
        padding:30px;
        position:relative;
      }

      .verify-overlay{
        position:absolute;
        inset:0;
        background:rgba(25,8,8,.45);
        backdrop-filter:blur(6px);
      }

      .top-bar{
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:54px;
        background:linear-gradient(90deg,#3c0d11,#68111d,#3c0d11);
        border-bottom:1px solid rgba(212,173,104,.25);
        color:#E8C98C;
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:0 28px;
        letter-spacing:3px;
        font-size:11px;
        z-index:2;
      }

      .verify-card{
        position:relative;
        z-index:1;
        width:540px;
        background:#F8F3EC;
        border-radius:28px;
        padding:42px;
        box-shadow:0 35px 80px rgba(0,0,0,.35);
      }

      .logo{
        text-align:center;
      }

      .diamond{
        width:9px;
        height:9px;
        background:#C9A25E;
        transform:rotate(45deg);
        margin:0 auto 14px;
      }

      .logo h1{
        font-family:'Cormorant Garamond',serif;
        letter-spacing:7px;
        color:#7B1E2B;
        font-size:38px;
      }

      .logo p{
        font-family:'Cormorant Garamond',serif;
        font-style:italic;
        color:#8A6A3E;
        margin-top:-5px;
      }

      .logo span{
        display:block;
        margin-top:8px;
        font-size:11px;
        letter-spacing:4px;
        color:#C09A56;
      }

      .divider{
        height:1px;
        background:#E8D8BF;
        margin:20px 0 28px;
      }

      .title{
        text-align:center;
      }

      .title h2{
        font-family:'Cormorant Garamond',serif;
        font-size:46px;
        color:#222;
      }

      .title p{
        color:#666;
        margin-top:8px;
        line-height:1.6;
      }

      .mail{
        color:#6B2432;
        font-weight:700;
      }

      .token{
        margin:22px auto;
        width:fit-content;
        border:1px solid #D7C39B;
        border-radius:20px;
        padding:8px 16px;
        font-size:11px;
        color:#9B7A43;
        letter-spacing:2px;
      }

      .otp-container{
        display:flex;
        justify-content:center;
        gap:12px;
        margin:28px 0;
      }

      .otp-box{
        width:58px;
        height:66px;
        border:1.8px solid #E1D8CB;
        border-radius:16px;
        background:#fff;
        text-align:center;
        font-size:28px;
        font-weight:600;
        color:#7B1E2B;
        outline:none;
        transition:.25s;
      }

      .otp-box:focus{
        border-color:#7B1E2B;
        box-shadow:0 0 0 3px rgba(123,30,43,.12);
      }

      .error{
        text-align:center;
        color:#C62828;
        font-size:13px;
        margin-top:-8px;
        margin-bottom:12px;
      }

      .otp-footer{
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:24px;
        font-size:14px;
      }

      .otp-footer p{
        color:#6E6E6E;
      }

      .otp-footer b{
        color:#7B1E2B;
      }

      .resend{
        background:none;
        border:none;
        color:#7B1E2B;
        letter-spacing:2px;
        cursor:pointer;
        font-weight:600;
      }

      .resend:disabled{
        color:#AAA;
        cursor:not-allowed;
      }

      .verify-btn{
        width:100%;
        padding:18px;
        border:none;
        border-radius:40px;
        background:linear-gradient(90deg,#7B001F,#5A0014);
        color:#fff;
        letter-spacing:3px;
        font-weight:600;
        cursor:pointer;
        transition:.3s;
      }

      .verify-btn:hover{
        transform:translateY(-2px);
        box-shadow:0 12px 25px rgba(123,30,43,.35);
      }

      .back{
        margin-top:30px;
        text-align:center;
        color:#666;
        cursor:pointer;
      }

      .support{
        margin-top:18px;
        text-align:center;
        color:#8A6A3E;
        font-size:13px;
      }

      .bottom-bar{
        position:absolute;
        bottom:0;
        left:0;
        width:100%;
        height:48px;
        background:linear-gradient(90deg,#3c0d11,#68111d,#3c0d11);
        border-top:1px solid rgba(212,173,104,.25);
        color:#E8C98C;
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:0 28px;
        letter-spacing:2px;
        font-size:11px;
        z-index:2;
      }

      @media(max-width:600px){
        .verify-card{
          width:100%;
          padding:30px 24px;
        }

        .otp-box{
          width:46px;
          height:56px;
          font-size:24px;
        }

        .top-bar,
        .bottom-bar{
          display:none;
        }
      }
    `;

    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (!email) {
      navigate("/signup");
      return;
    }

    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, email, navigate]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const submitOTP = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await verifyOTP({
        email,
        otp: code,
      });

      localStorage.setItem("token", data.token);

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      setResending(true);

      await resendOTP({ email });

      setTimer(60);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="verify-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="verify-overlay"></div>

      <div className="top-bar">
        <div>• ELARQUE ATELIER · PARIS · DALLAS</div>
        <div>AUTUMN / WINTER MMXXV</div>
        <div>CLIENT CONCIERGE</div>
      </div>

      <div className="verify-card">
        <div className="logo">
          <div className="diamond"></div>
          <h1>ELARQUE</h1>
          <p>Luxury Western Fashion</p>
          <span>TIMELESS ELEGANCE • MODERN CONFIDENCE</span>
        </div>

        <div className="divider"></div>

        <div className="title">
          <h2>Verify Your Account</h2>
          <p>
            We have sent a 6-digit atelier code to
            <br />
            <span className="mail">{email}</span>
          </p>
        </div>

        <div className="token">
          • ENCRYPTED ATELIER TOKEN • EXPIRES IN 1 MIN
        </div>

        <div className="otp-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              className="otp-box"
              value={digit}
              maxLength={1}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="otp-footer">
          <p>
            Resend in <b>00:{String(timer).padStart(2, "0")}</b>
          </p>

          <button
            className="resend"
            disabled={timer > 0 || resending}
            onClick={resend}
          >
            RESEND CODE
          </button>
        </div>

        <button
          className="verify-btn"
          onClick={submitOTP}
          disabled={loading}
        >
          {loading ? "VERIFYING..." : "VERIFY ACCOUNT →"}
        </button>

        <div
          className="back"
          onClick={() => navigate("/signup")}
        >
          ← Back to Sign Up
        </div>

        <div className="support">
          Having trouble? Contact Haute Concierge
        </div>
      </div>

      <div className="bottom-bar">
        <div>© 2025 ELARQUE HAUTE FRONTIER ATELIER</div>
        <div>PRIVACY POLICY · CLIENT CONCIERGE · ATELIER TERMS</div>
      </div>
    </div>
  );
}

export default VerifyOTP;