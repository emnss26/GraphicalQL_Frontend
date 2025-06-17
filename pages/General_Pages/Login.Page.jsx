import React from "react";
import GeneralLayout from "@/components/general_component/GeneralLayout";

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
    <GeneralLayout>
      <div className="flex flex-col items-center justify-center min-h-full bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Login to Autodesk</h1>
        <p className="mb-4 text-gray-600">
          Please authenticate to access the AEC Model.
        </p>
        <button
          className="btn-primary font-medium px-6 py-3 rounded-md shadow transition-colors"
          onClick={handleLogin}
        >
          Authenticate
        </button>
      </div>
    </GeneralLayout>
  );
};
export default LoginPage;
