import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

import AppLayout from "@/components/general_component/AppLayout";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

export default function AECProjectsPage() {
  const [cookies] = useCookies(["access_token"]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
      const fetchAccProjects = async () => {
        try {
          const response = await fetch(`${backendUrl}/aec/graphql-projects`, {
            credentials: "include",
          });
          const result = await response.json();

          console.log("Fetched Projects:", result.data.aecProjects);

          setProjects(result.data.aecProjects);
        } catch (err) {
        setError("Failed to fetch projects.");
        console.error(err);
      }
    };

    fetchAccProjects();
  }, []);

   useEffect(() => {
      console.log({ projects,  error });
    }, [projects, error]);
  
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

   return (
     <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[70vh]">
        {/* Izquierda: Logo */}
        <div className="flex items-center justify-center">
          <img
            src="/Abitat_img.png"
            alt="Abitat Construction Solutions"
            className="max-h-[220px] w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Derecha: Lista de proyectos */}
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold mb-4">Projects List</h2>

          <div className="w-full max-w-2xl bg-white rounded-xl shadow p-4"
               style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {error && <p className="text-red-600 mb-3">{error}</p>}

            {projects.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="bg-neutral-50 border border-neutral-200 shadow-sm rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="pr-3">
                      <h3 className="text-sm font-semibold">{p.name}</h3>
                    </div>

                    <button
                      className="rounded-md border border-neutral-300 bg-neutral-100 text-[rgb(170,32,47)] px-3 py-1.5 text-xs font-medium shadow-sm transition-colors duration-500 hover:bg-[rgb(170,32,47)] hover:text-white"
                      onClick={() => {
                        sessionStorage.setItem(
                          "altProjectId",
                          p.alternativeIdentifiers
                            ?.dataManagementAPIProjectId
                        );
                        sessionStorage.setItem("projectName", p.name); 
                        
                        navigate(`/plans/${p.id}`);
                      }}
                    >
                      Project Home
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500 text-center">
                No projects found.
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
    );
  }