import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import MainLayout from "@/components/general_component/MainLayout";

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
     <MainLayout>
   <div className="flex w-full h-[90vh] items-center justify-center">
    {/* Izquierda: Logo centrado */}
    <div className="flex-1 flex items-center justify-center">
      <img
        src="/Abitat_img.png"
        alt="Abitat Construction Solutions"
        className="max-h-[220px] w-auto object-contain drop-shadow-md"
      />
    </div>
    {/* Derecha: Lista de proyectos centrada */}
    <div className="flex-1 flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold mb-6">Projects List</h2>
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow p-4"
        style={{
          height: "750px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {projects.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {projects.map((aecProject) => (
              <li
                key={aecProject.id}
                className="bg-gray-100 shadow rounded-xl p-4 flex justify-between items-center border border-gray-300"
              >
                <div>
                  <h2 className="text-lg font-semibold">{aecProject.name}</h2>
                </div>
                <Button
                  className="bg-[rgb(170,32,47)] text-white text-sm font-semibold px-4 py-2 rounded-md shadow hover:bg-slate-200 hover:text-black transition-colors"
                  onClick={() => {
                    sessionStorage.setItem(
                      'altProjectId',
                      aecProject.alternativeIdentifiers.dataManagementAPIProjectId
                    );
                    navigate(`/plans/${aecProject.id}`);
                  }}
                >
                  Project Home
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No projects found.</p>
        )}
      </div>
    </div>
  </div>
  </MainLayout>
    );
  }