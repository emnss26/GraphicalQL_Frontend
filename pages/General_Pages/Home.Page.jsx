import React from "react";
import { useNavigate } from "react-router-dom";
import GeneralLayout from "@/components/general_component/GeneralLayout";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <GeneralLayout>
      <div className="flex h-full">
        <div className="w-1/2" />
        <div className="w-1/2 flex flex-col justify-center items-end p-8 space-y-4">
          <h1 className="text-3xl font-bold text-right">Welcome to the Home Page</h1>
          <button
            className="bg-[rgb(170,32,47)] text-white px-6 py-3 rounded-md shadow"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    </GeneralLayout>
  );
}
export default HomePage;
