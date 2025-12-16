import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { User } from "lucide-react";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

export default function GeneralLayout({ children, noPadding = false }) {
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["access_token"]);
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    //let ignore = false;
    const loadUser = async () => {
      try {
        const res = await fetch(`${backendUrl}/auth/userprofile`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("Error fetching user profile:");
          setError("Error fetching user profile");
          return;
        }

        const data = await res.json();
        console.log ("User", data.email)
        setUserProfile(data.email);

        
      } catch {
        setError(
          error?.response?.data?.message || "Error fetching user profile"
        );
      }
    };
    loadUser ()
  }, [cookies.access_token]);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    removeCookie("access_token", { path: "/" });
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <header className="bg-[rgb(75,80,86)] text-white px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="text-sm sm:text-base font-medium opacity-90 hover:opacity-100 transition"
          title="Ir al inicio"
        >
          Abitat Construction Solutions
        </button>

        {/* Menú de usuario */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-1.5 hover:bg-white/10 transition"
            title={userProfile || "Usuario"}
          >
            <User className="w-6 h-6" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black/5 p-2 text-sm text-neutral-700 z-50"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="px-2 py-1.5 border-b text-xs text-neutral-500">
                {userProfile || "Not signed in"}
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/aec/projects");
                }}
                className="w-full text-left px-2 py-2 rounded hover:bg-neutral-100"
              >
                Go to Projects
              </button>
              {!!userProfile && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-2 rounded hover:bg-neutral-100 text-red-600"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={`flex-1 overflow-auto ${noPadding ? "" : "p-4"}`}>
        {children}
      </main>

      <footer className="bg-[rgb(170,32,47)] text-white p-2 flex justify-end">
        <span>Abitat Construction Solutions</span>
      </footer>
    </div>
  );
}
