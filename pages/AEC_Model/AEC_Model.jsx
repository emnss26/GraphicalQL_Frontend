import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

const AECModelPage = () => {
  const [cookies, setCookie] = useCookies(["access_token"]);
  const [hubs, setHubs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await fetch(`${backendUrl}/aec/graphql-hubs`, {
          credentials: "include",
        });
        const result = await response.json();

        console.log("Fetched Hubs:", result.data.hubs);
        setHubs(result.data.hubs);
      } catch (err) {
        setError("Failed to fetch hubs.");
        console.error(err);
      }
    };

    fetchHubs();
  }, []);

  // Check if the token exists
  if (!cookies) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p className="mb-4 text-gray-600">
          You need to log in to access the AEC Model.
        </p>
        <button
          className="btn-primary font-medium px-6 py-3 rounded-md shadow transition-colors"
          onClick={() => (window.location.href = "/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  console.log("Cookies:", cookies);
  console.log("Hubs:", hubs);

  return (
    <div className="aec-model-page">
      <h1>AEC Model Page</h1>
      {/* Add your AEC Model content here */}
      <p>
        Welcome to the AEC Model page. Here you can view and interact with the
        AEC model.
      </p>
      {/* Example content */}
    </div>
  );
};

export default AECModelPage;
