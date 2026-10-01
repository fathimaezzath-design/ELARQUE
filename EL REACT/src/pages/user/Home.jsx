import { useNavigate } from "react-router-dom";
import { User, ShoppingBag, Heart, Search } from "lucide-react";

function Home() {
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
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F3EC",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 40px",
          borderBottom: "1px solid #E6D8C3",
          background: "#F8F3EC",
        }}
      >
        <h2
          style={{
            color: "#7B1E2B",
            letterSpacing: "6px",
            margin: 0,
          }}
        >
          ELARQUE
        </h2>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Search style={{ cursor: "pointer" }} />
          <Heart style={{ cursor: "pointer" }} />
          <ShoppingBag style={{ cursor: "pointer" }} />
          <User
            onClick={handleProfileClick}
            style={{ cursor: "pointer" }}
          />
        </div>
      </nav>

      <div
        style={{
          textAlign: "center",
          padding: "120px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "60px",
            color: "#222",
            marginBottom: "20px",
          }}
        >
          ELARQUE
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#666",
          }}
        >
          Luxury Western Fashion
        </p>
      </div>
    </div>
  );
}

export default Home;