import React from "react";
import { useNavigate } from "react-router-dom";
import GeneralLayout from "@/components/general_component/GeneralLayout";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <GeneralLayout>
      <div className="home-page">
        <h1>Welcome to the Home Page</h1>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    </GeneralLayout>
  );
}
export default HomePage;
