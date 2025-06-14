import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <h1>Welcome to the Home Page</h1>
      <button onClick={() => navigate("/login")}>Go to Login</button>
      
    </div>
  )
}
export default HomePage;
