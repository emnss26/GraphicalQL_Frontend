import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";

// Icons
import { FolderOpen } from "lucide-react";

// Components
import AppLayout from "@/components/general_component/AppLayout";
import AbitatLogoLoader from "@/components/general_component/AbitatLogoLoader"; 

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

export default function AECProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cookies] = useCookies(["access_token"]); // Necesario para disparar el useEffect si cambia
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendUrl}/aec/graphql-projects`, {
          credentials: "include",
        });

        // Validación de seguridad
        if (response.status === 401 || response.status === 403) {
           navigate("/login");
           return;
        }

        const result = await response.json();
        
        if (!result.success && result.error) {
            throw new Error(result.error);
        }

        console.log("Fetched Projects:", result.data?.aecProjects);
        setProjects(result.data?.aecProjects || []);
      } catch (err) {
        setError("No se pudieron cargar los proyectos. Revisa tu conexión.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccProjects();
  }, [navigate]);

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[80vh] p-6">
        
        {/* Izquierda: Logo Estático */}
        <div className="flex items-center justify-center animate-in fade-in duration-700 slide-in-from-left-10">
          <img
            src="/Abitat_img.png"
            alt="Abitat Construction Solutions"
            className="max-h-[220px] w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Derecha: Lista de proyectos o Loader */}
        <div className="flex flex-col items-center justify-center w-full">
          
          <h2 className="text-2xl font-bold mb-6 text-gray-800 tracking-tight">
            Lista de Proyectos
          </h2>

          <div 
            // CAMBIO: max-w-2xl para hacer la lista más ancha
            className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-1 min-h-[400px] flex flex-col relative overflow-hidden"
          >
            {/* --- LOADER --- */}
            {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10 animate-in fade-in duration-300">
                    <AbitatLogoLoader className="scale-75" />
                    <p className="mt-4 text-sm text-gray-500 font-medium animate-pulse">Cargando...</p>
                </div>
            ) : null}

            {/* --- ERROR --- */}
            {error && !loading && (
                <div className="p-6 flex flex-col items-center text-center h-full justify-center">
                    <div className="text-red-500 text-lg mb-2">⚠️</div>
                    <p className="text-red-600 font-medium">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-sm text-gray-500 underline hover:text-gray-800">Reintentar</button>
                </div>
            )}

            {/* --- LISTA --- */}
            {!loading && !error && (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" style={{ maxHeight: "60vh" }}>
                    {projects.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                        {projects.map((p) => (
                        <li
                            key={p.id}
                            className="group bg-white border border-gray-100 hover:border-[rgb(170,32,47)]/30 hover:shadow-md rounded-xl p-4 flex justify-between items-center transition-all duration-300"
                        >
                            <div className="pr-4">
                                <h3 className="text-sm font-bold text-gray-800 group-hover:text-[rgb(170,32,47)] transition-colors">
                                    {p.name}
                                </h3>
                                {/* Se eliminó el párrafo con el ID para limpiar la vista */}
                            </div>

                            <button
                                className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 rounded-lg bg-[rgb(170,32,47)] text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all duration-300 hover:bg-[rgb(150,28,42)] hover:shadow-md active:scale-95 whitespace-nowrap"
                                onClick={() => {
                                    sessionStorage.setItem(
                                    "altProjectId",
                                    p.alternativeIdentifiers?.dataManagementAPIProjectId
                                    );
                                    sessionStorage.setItem("projectName", p.name);
                                    navigate(`/plans/${p.id}`);
                                }}
                            >
                                Abrir Proyecto →
                            </button>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <FolderOpen className="h-10 w-10 mb-2 opacity-20" />
                        <p>No se encontraron proyectos disponibles.</p>
                    </div>
                    )}
                </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}