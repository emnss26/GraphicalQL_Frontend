import React from "react";
import { useNavigate } from "react-router-dom";
import GeneralLayout from "@/components/general_component/GeneralLayout";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <GeneralLayout>

      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-white">
        <img
          src="/Abitat_img.png"
          alt="Abitat Construction Solutions"
          className="max-h-[180px] w-auto object-contain mb-8"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.1))" }}
        />
        <h1 className="text-7xl font-bold text-center mb-6">
          Welcome to the Home Page
        </h1>
        <button
          className="bg-[rgb(170,32,47)] text-white px-6 py-3 rounded-md shadow text-lg"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>

      </div>
    </GeneralLayout>
  );
}
export default HomePage;
