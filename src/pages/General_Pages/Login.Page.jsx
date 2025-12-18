import React from "react";
import AppLayout from "@/components/general_component/AppLayout";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;
const clientId = import.meta.env.VITE_CLIENT_ID;

const LoginPage = () => {

  const handleLogin = () => {
    const options = {
      client_id: clientId,
      redirect_uri: `${backendUrl}/auth/three-legged`,
      scope: "data:read data:create data:write",
      response_type: "code",
    };

    const url = `https://developer.api.autodesk.com/authentication/v2/authorize?response_type=${options.response_type}&client_id=${options.client_id}&redirect_uri=${options.redirect_uri}&scope=${options.scope}`;
    window.location.href = url;
  };

  return (
    <AppLayout noPadding={true}>
      <div className="h-full grid grid-cols-1 md:grid-cols-2 bg-white">
        {/* Columna izquierda: logo */}
        <div className="flex items-center justify-center p-6">
          <img
            src="/Abitat_img.png"
            alt="Abitat Construction Solutions"
            className="w-auto max-h-[220px] md:max-h-[280px] object-contain"
            style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))" }}
          />
        </div>

        {/* Columna derecha: título, texto y botón (centrados) */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md text-center space-y-4">
            <h1 className="text-neutral-700 text-3xl md:text-4xl font-semibold tracking-tight">
              Login
            </h1>

            <p className="text-neutral-600">
              Please authenticate to access the platform using your Autodesk
              account.
            </p>

            <button
              onClick={handleLogin}
              className="
                inline-flex items-center justify-center
                rounded-md border border-neutral-300
                bg-neutral-100 text-[rgb(170,32,47)]
                px-6 py-2.5 text-sm font-medium shadow-sm
                transition-colors duration-500 ease-out
                hover:bg-[rgb(170,32,47)] hover:text-white
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-offset-2
                focus-visible:ring-[rgb(170,32,47)]
                active:scale-[0.99]
              "
            >
              Authenticate with Autodesk
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default LoginPage;
