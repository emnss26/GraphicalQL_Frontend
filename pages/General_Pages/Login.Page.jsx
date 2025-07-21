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
<<<<<<< HEAD
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
=======
      <div className="flex h-full bg-white">
        <div className="w-1/2" />
        <div className="w-1/2 flex flex-col justify-center items-end p-8 space-y-4">
          <h1 className="text-3xl font-bold text-right">Login to Autodesk</h1>
          <p className="text-gray-600 text-right">
            Please authenticate to access the AEC Model.
          </p>
          <button
            className="bg-[rgb(170,32,47)] text-white px-6 py-3 rounded-md shadow"
            onClick={handleLogin}
          >
            Authenticate
          </button>
        </div>
>>>>>>> 0106298dc6c00046c1d5875dddc2a42f67a2eb6d
      </div>
    </GeneralLayout>
  );
};
export default LoginPage;
