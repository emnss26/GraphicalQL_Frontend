import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { User } from "lucide-react";
import MainSideBar from "@/components/general_component/MainSideBar";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["access_token"]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let ignore = false;
    const loadUser = async () => {
      try {
        const res = await fetch(`${backendUrl}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const j = await res.json();
        if (!ignore) setEmail(j?.email || j?.user?.email || "");
      } catch {}
    };
    if (cookies.access_token) loadUser();
    return () => {
      ignore = true;
    };
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
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-[rgb(75,80,86)] text-white px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/")}
          className="text-sm sm:text-base font-medium opacity-90 hover:opacity-100 transition"
          title="Ir al inicio"
        >
          Abitat Construction Solutions
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/aec/projects")}
            className="hidden sm:inline-flex items-center rounded-md border border-neutral-300 bg-neutral-100 text-[rgb(170,32,47)] px-3 py-1.5 text-xs font-medium shadow-sm transition-colors duration-500 hover:bg-[rgb(170,32,47)] hover:text-white"
          >
            Go Projects
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center rounded-md border border-neutral-300 bg-neutral-100 text-[rgb(170,32,47)] px-3 py-1.5 text-xs font-medium shadow-sm transition-colors duration-500 hover:bg-[rgb(170,32,47)] hover:text-white"
          >
            Logout
          </button>

          <div className="ml-1 flex items-center gap-1 text-xs opacity-80">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{email || "Guest"}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <MainSideBar />
        <main className="flex-1 p-4 bg-white">{children}</main>
      </div>

      <footer className="bg-[rgb(170,32,47)] text-white p-2 flex justify-end">
        <span>Abitat Construction Solutions</span>
      </footer>
    </div>
  );
}
