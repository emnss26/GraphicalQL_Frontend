import React from "react";
import { useNavigate } from "react-router-dom";
import GeneralLayout from "@/components/general_component/GeneralLayout";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <GeneralLayout>
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        {/* Logo */}
        <img
          src="/Abitat_img.png"
          alt="Abitat Construction Solutions"
          className="w-auto max-h-[160px] md:max-h-[180px] object-contain mb-6"
          style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))" }}
        />

        {/* Título + botón */}
        <div className="flex flex-col items-center mt-4 space-y-5">
          <h1 className="text-neutral-700 text-2xl sm:text-2xl md:text-2xl tracking-tight text-center">
            Internal BIM Management Platform
          </h1>

          <button
            onClick={() => navigate("/login")}
            className="
              inline-flex items-center justify-center
              rounded-md border border-neutral-300
              bg-neutral-100 text-[rgba(32, 31, 31, 1)]
              px-6 py-2.5 text-sm font-medium shadow-sm
              transition-colors duration-500 ease-out
              hover:bg-[rgb(170,32,47)] hover:text-white
              focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-[rgb(170,32,47)]
              active:scale-[0.99]
            "
            aria-label="Go to Login"
          >
            Go to Login
          </button>
        </div>
      </div>
    </GeneralLayout>
  );
};

export default HomePage;