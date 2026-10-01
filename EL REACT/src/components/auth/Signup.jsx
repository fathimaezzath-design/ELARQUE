import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../../assets/images/Signup.png";
import API from "../../services/authService";
import {
  User,
  Mail,
  Phone,
  Gift,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

function SignUp() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    referralCode: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Poppins:wght@300;400;500;600&display=swap');

      *{margin:0;padding:0;box-sizing:border-box;}

      body{
        font-family:'Poppins',sans-serif;
        background:#111;
      }

      .signup-page{
        min-height:100vh;
        background-size:cover;
        background-position:center;
        display:flex;
        justify-content:center;
        align-items:center;
        padding:40px;
        position:relative;
        overflow:hidden;
      }

      .overlay{
        position:absolute;
        inset:0;
        background:rgba(18,8,6,.45);
        backdrop-filter:blur(8px);
      }

      .signup-card{
        position:relative;
        z-index:1;
        width:640px;
        background:#F8F3EC;
        border-radius:28px;
        padding:42px;
        box-shadow:0 30px 60px rgba(0,0,0,.35);
      }

      .logo-area{text-align:center;margin-bottom:15px;}

      .diamond{
        width:10px;
        height:10px;
        background:#C9A25E;
        transform:rotate(45deg);
        margin:auto;
        margin-bottom:15px;
      }

      .logo-area h1{
        font-family:'Cormorant Garamond',serif;
        letter-spacing:7px;
        color:#7B1E2B;
        font-size:42px;
      }

      .luxury{
        font-family:'Cormorant Garamond',serif;
        font-style:italic;
        color:#8A6A3E;
        margin-top:-5px;
      }

      .logo-area span{
        display:block;
        margin-top:8px;
        font-size:11px;
        letter-spacing:4px;
        color:#C09A56;
      }

      hr{
        border:none;
        height:1px;
        background:#E7D8BF;
        margin:18px 0 28px;
      }

      .heading{text-align:center;margin-bottom:28px;}

      .heading h2{
        font-family:'Cormorant Garamond',serif;
        font-size:40px;
        color:#222;
      }

      .heading p{
        color:#666;
        font-size:15px;
      }

      label{
        display:block;
        width:100%;
        text-align:left;
        font-size:11px;
        font-weight:700;
        letter-spacing:2px;
        color:#6B2432;
        margin-bottom:8px;
      }

      form>label{margin-top:18px;}

      .error-text{
        color:#C62828;
        font-size:12px;
        font-weight:500;
        margin-bottom:6px;
        text-align:left;
      }

      .input-box{
        display:flex;
        align-items:center;
        border:1.5px solid #B3B6BE;
        background:#fff;
        border-radius:16px;
        padding:14px 16px;
        gap:10px;
      }

      .input-error{
        border:1.5px solid #C62828 !important;
      }

      .input-box input{
        border:none;
        outline:none;
        flex:1;
        font-size:15px;
        background:transparent;
        color:#444;
      }

      .eye-icon{
        cursor:pointer;
      }

      .two-col{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:16px;
        margin-top:18px;
      }

      .two-col>div{
        display:flex;
        flex-direction:column;
      }

      .agree{
        display:flex;
        align-items:flex-start;
        gap:10px;
        margin:24px 0;
      }

      .agree input{
        margin-top:4px;
        accent-color:#7B1E2B;
      }

      .agree p{
        font-size:13px;
        color:#555;
        line-height:1.5;
      }

      .agree span{
        color:#7B1E2B;
        font-weight:600;
      }

      .create-btn{
        width:100%;
        padding:17px;
        border:none;
        border-radius:40px;
        background:linear-gradient(90deg,#7B1E2B,#5A0014);
        color:white;
        font-size:15px;
        font-weight:600;
        letter-spacing:3px;
        cursor:pointer;
      }

      .create-btn:disabled{
        opacity:.7;
        cursor:not-allowed;
      }

      .divider{
        display:flex;
        align-items:center;
        justify-content:center;
        margin:24px 0;
      }

      .divider::before,
      .divider::after{
        content:"";
        flex:1;
        height:1px;
        background:#E3D7C4;
      }

      .divider span{
        padding:0 12px;
        font-size:11px;
        letter-spacing:3px;
        color:#C19A59;
      }

      .google-btn{
        width:100%;
        padding:15px;
        border-radius:30px;
        border:1px solid #DDD;
        background:#fff;
        display:flex;
        justify-content:center;
        align-items:center;
        gap:12px;
        cursor:pointer;
        font-size:15px;
        font-weight:500;
        color:#000;
        transition:.3s;
      }

      .google-btn:hover{
        background:#F8F8F8;
        border-color:#C9A25E;
      }

      .google-btn img{
        width:22px;
        height:22px;
      }

      .signin{
        margin-top:28px;
        text-align:center;
        font-size:14px;
        color:#666;
      }

      .signin span{
        color:#7B1E2B;
        font-weight:700;
        cursor:pointer;
      }

      @media(max-width:768px){
        .signup-page{padding:20px;}

        .signup-card{
          width:100%;
          padding:30px 24px;
        }

        .two-col{
          grid-template-columns:1fr;
        }

        .logo-area h1{
          font-size:34px;
        }

        .heading h2{
          font-size:32px;
        }
      }
    `;

    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear field and server errors while typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      server: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim())
      newErrors.fullName = "Please enter your full name.";

    if (!formData.email.trim())
      newErrors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address.";

    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Please enter your phone number.";
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber))
      newErrors.phoneNumber = "Phone number must contain exactly 10 digits.";

    if (!formData.password)
      newErrors.password = "Please create a password.";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters long.";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password.";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";

    if (!formData.agreedToTerms)
      newErrors.agreedToTerms =
        "Please accept the Terms & Privacy Policy to continue.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      await API.post("/register", formData);

      navigate("/verify-otp", {
        state: {
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          referralCode: formData.referralCode,
        },
      });
    } catch (err) {
      setErrors({
        server:
          err.response?.data?.message ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="signup-page"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="overlay"></div>

      <div className="signup-card">
        <div className="logo-area">
          <div className="diamond"></div>

          <h1>ELARQUE</h1>

          <p className="luxury">Luxury Western Fashion</p>

          <span>TIMELESS ELEGANCE • MODERN CONFIDENCE</span>
        </div>

        <hr />

        <div className="heading">
          <h2>Create Your Fashion Account</h2>
          <p>Join the Elarque luxury fashion experience.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>FULL NAME</label>
          {errors.fullName && (
            <p className="error-text">{errors.fullName}</p>
          )}
          <div className={`input-box ${errors.fullName ? "input-error" : ""}`}>
            <User size={18} color="#8B8B8B" />
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Customer Name"
            />
          </div>

          <label>EMAIL ADDRESS</label>
          {errors.email && (
            <p className="error-text">{errors.email}</p>
          )}
          <div className={`input-box ${errors.email ? "input-error" : ""}`}>
            <Mail size={18} color="#8B8B8B" />
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@elarque.com"
            />
          </div>

          <div className="two-col">
            <div>
              <label>PHONE NUMBER</label>
              {errors.phoneNumber && (
                <p className="error-text">{errors.phoneNumber}</p>
              )}
              <div
                className={`input-box ${
                  errors.phoneNumber ? "input-error" : ""
                }`}
              >
                <Phone size={18} color="#8B8B8B" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label>REFERRAL CODE</label>
              <div className="input-box">
                <Gift size={18} color="#8B8B8B" />
                <input
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  placeholder="VIP-ATELIER-25"
                />
              </div>
            </div>
          </div>

          <div className="two-col">
            <div>
              <label>PASSWORD</label>
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
              <div
                className={`input-box ${errors.password ? "input-error" : ""}`}
              >
                <Lock size={18} color="#8B8B8B" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••"
                />
                {showPassword ? (
                  <EyeOff
                    size={18}
                    className="eye-icon"
                    color="#8B8B8B"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <Eye
                    size={18}
                    className="eye-icon"
                    color="#8B8B8B"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            </div>

            <div>
              <label>CONFIRM PASSWORD</label>
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
              <div
                className={`input-box ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
              >
                <ShieldCheck size={18} color="#8B8B8B" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••••"
                />
                {showConfirmPassword ? (
                  <EyeOff
                    size={18}
                    className="eye-icon"
                    color="#8B8B8B"
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <Eye
                    size={18}
                    className="eye-icon"
                    color="#8B8B8B"
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )}
              </div>
            </div>
          </div>

          {errors.agreedToTerms && (
            <p className="error-text">{errors.agreedToTerms}</p>
          )}

          <div className="agree">
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
            />

            <p>
              I agree to receive private collection invitations and accept the
              <span> Bespoke Terms </span>
              and
              <span> Privacy Policy.</span>
            </p>
          </div>

          {errors.server && (
            <p className="error-text">{errors.server}</p>
          )}

          <button
            className="create-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "CREATING..."
              : "CREATE ELARQUE ACCOUNT →"}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="google-btn" type="button">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
            />
            Continue with Google
          </button>

          <div className="signin">
            Already have an account?
            <span onClick={() => navigate("/login")}> Sign In</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignUp;