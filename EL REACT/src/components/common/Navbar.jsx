import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <nav>
      <button onClick={handleProfileClick}>
        <User size={22} />
      </button>
    </nav>
  );
}

export default Navbar;