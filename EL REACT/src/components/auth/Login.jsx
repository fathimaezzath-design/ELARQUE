import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../config/firebase";

import bg from "../../assets/images/Login.png";

import { Mail, Lock, Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&family=Poppins:wght@300;400;500;600&display=swap');

*{
margin:0;
padding:0;
box-sizing:border-box;
}

.login-page{
min-height:100vh;
display:grid;
grid-template-columns:58% 42%;
background:#F7F2EB;
font-family:'Poppins',sans-serif;
}

.left{
  position:relative;
  background-image:url(${bg});
  background-size:cover;
  background-position:center;
  background-repeat:no-repeat;
  min-height:100vh;
}

.left::after{
content:"";
position:absolute;
inset:0;
background:linear-gradient(180deg,rgba(36, 45, 39, 0.25),rgba(80,0,15,.45));
}

.left-content{
position:absolute;
z-index:2;
inset:0;
padding:38px;
display:flex;
flex-direction:column;
justify-content:space-between;
color:white;
}

.tag{
display:inline-flex;
padding:10px 18px;
border-radius:30px;
border:1px solid rgba(79, 71, 71, 0.25);
font-size:12px;
letter-spacing:2px;
width:fit-content;
}

.quote small{
letter-spacing:3px;
color:#E3C77D;
}

.quote h2{
font-family:'Cormorant Garamond',serif;
font-size:52px;
margin-top:16px;
line-height:1.15;
max-width:520px;
}

.right{
display:flex;
justify-content:center;
align-items:center;
padding:40px;
}

.card{
width:100%;
max-width:470px;
background:white;
border-radius:32px;
padding:46px;
}

.logo{
text-align:center;
margin-bottom:25px;
}

.logo h1{
font-family:'Cormorant Garamond',serif;
letter-spacing:6px;
color:#7B1E2B;
}

.logo span{
font-size:10px;
letter-spacing:3px;
color:#C19A59;
}

.title{
text-align:center;
font-family:'Cormorant Garamond',serif;
font-size:44px;
margin-bottom:10px;
}

.subtitle{
text-align:center;
color:#666;
margin-bottom:30px;
}

label{
display:block;
font-size:11px;
font-weight:700;
letter-spacing:2px;
margin-bottom:8px;

color:#5A1E28;
}

.input-box{
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:12px;
  border:1px solid #DDD3C7;
  border-radius:16px;
  padding:14px 16px;
  margin-bottom:18px;
  background:#fff;
}

.input-box input{
  flex:1;
  border:none;
  outline:none;
  font-size:15px;
  background:transparent;
  color:#333;
  text-align:left;
}

.input-box input::placeholder{
  color:#8B8B8B;
  text-align:left;
}

.error{
color:#C62828;
font-size:13px;
margin:-12px 0 12px;
}

.row{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:24px;
font-size:13px;
}

.forgot{
color:#7B1E2B;
cursor:pointer;
font-weight:600;
}

.login-btn{
width:100%;
padding:17px;
border:none;
border-radius:40px;
background:linear-gradient(90deg,#7B1E2B,#5A0014);
color:white;
font-weight:600;
letter-spacing:3px;
cursor:pointer;
}

.divider{
display:flex;
align-items:center;
margin:25px 0;
}

.divider::before,.divider::after{
content:"";
flex:1;
height:1px;
background:#E6DED2;
}

.divider span{
padding:0 12px;
font-size:11px;
letter-spacing:3px;
color:#B89A61;
}
.google{
width:100%;
padding:14px;
border:1px solid #DDD;
border-radius:16px;
background:white;
cursor:pointer;
display:flex;
align-items:center;
justify-content:center;
gap:12px;
color:#000;
font-size:15px;
font-weight:500;
transition:.3s;
}

.google:hover{
background:#F8F8F8;
border-color:#C9A25E;
}

.google img{
width:22px;
height:22px;
}

.signup{
margin-top:28px;
text-align:center;
font-size:14px;
}

.signup span{
color:#7B1E2B;
font-weight:700;
cursor:pointer;
}

@media(max-width:900px){

.login-page{
grid-template-columns:1fr;
}

.left{
display:none;
}

.card{
padding:34px;
}

}
`;

    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    setErrors({ ...errors, [name]: "", server: "" });
  };

  const validate = () => {
    const e = {};

    if (!formData.email.trim()) e.email = "Email is required.";

    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = "Enter a valid email.";

    if (!formData.password) e.password = "Password is required.";

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const { data } = await loginUser(formData);

      localStorage.setItem("token", data.token);

      navigate("/");
    } catch (err) {
      setErrors({
        server: err.response?.data?.message || "Login failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        const user = result.user;

        console.log(user.displayName);
        console.log(user.email);

        // Later we'll send this to your Node backend
        navigate("/");
    } catch (error) {
        console.log(error);
    }
    };

  return (
    <div className="login-page">
      <div className="left">
        <div className="left-content">
          <div className="tag">• ELARQUE WESTERNS</div>

          <div className="quote">
            <small>THE MODERN FRONTIER</small>

            <h2>
              “A modern cadence of couture and western frontier spirit.”
            </h2>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="card">
          <div className="logo">
            <h1>ELARQUE</h1>

          </div>

          <h2 className="title">Welcome Back</h2>

          <p className="subtitle">
            Sign in to discover timeless western dresses.
          </p>

          {errors.server && (
            <div className="error">{errors.server}</div>
          )}

          <form onSubmit={handleSubmit}>
            <label>EMAIL ADDRESS</label>

            <div className="input-box">
              <Mail size={18} />

              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="client@elarque.com"
              />
            </div>

            {errors.email && (
              <div className="error">{errors.email}</div>
            )}

            <div className="row">
              <label>PASSWORD</label>

              <span
                className="forgot"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </span>
            </div>

            <div className="input-box">
              <Lock size={18} />

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />

              {showPassword ? (
                <EyeOff
                  size={18}
                  onClick={() => setShowPassword(false)}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <Eye
                  size={18}
                  onClick={() => setShowPassword(true)}
                  style={{ cursor: "pointer" }}
                />
              )}
            </div>

            {errors.password && (
              <div className="error">{errors.password}</div>
            )}



            <button className="login-btn" disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN →"}
            </button>
          </form>

          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <button className="google" type="button" onClick={handleGoogleLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
          />
          Continue with Google
          </button>
          <div className="signup">
            New to Elarque?
            <span onClick={() => navigate("/signup")}>
              {" "}
              CREATE ACCOUNT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;