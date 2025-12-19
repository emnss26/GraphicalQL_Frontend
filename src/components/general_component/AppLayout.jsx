import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { 
  Building2, Home, FileSpreadsheet, Settings, LogOut, 
  ChevronLeft, ChevronRight, User, Bell 
} from "lucide-react";
import { cn } from "@/lib/utils"; // Asegúrate de tener esta utilidad de shadcn, si no, usa una función simple
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const backendUrl = import.meta.env.VITE_API_BACKEND_BASE_URL;

const NAVIGATION = [
  { id: "home", label: "Inicio", icon: Home, href: "/" },
  { id: "sheets", label: "Control de Planos", icon: FileSpreadsheet, href: "/aec-projects", active: true },
  { id: "settings", label: "Configuración", icon: Settings, href: "/settings" },
];

export default function AppLayout({ children, noPadding = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cookies, , removeCookie] = useCookies(["access_token"]);
  const [userEmail, setUserEmail] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/auth/userprofile`, { credentials: "include" });
        if (!res.ok) throw new Error("No auth");
        const data = await res.json();
        setUserEmail(data.data.email || "");
        setIsLoggedIn(true);
      } catch {
        setUserEmail("");
        setIsLoggedIn(false);
      }
    })();
  }, [cookies.access_token]);

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    removeCookie("access_token", { path: "/" });
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* --- SIDEBAR --- */}
      <aside
        className={cn(
          "flex flex-col bg-slate-900 text-slate-50 border-r border-slate-800 transition-all duration-300 ease-in-out z-20",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[rgb(170,32,47)] flex items-center justify-center shadow-lg shadow-red-900/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-300">
                <span className="text-sm font-bold truncate tracking-tight">Abitat Construction</span>
                <span className="text-[10px] text-slate-400 truncate uppercase tracking-wider">Solutions</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
          <TooltipProvider delayDuration={0}>
            {NAVIGATION.map((item) => {
              const isActive = location.pathname.includes(item.href) && item.href !== "/";
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                        isActive
                          ? "bg-slate-800 text-white shadow-sm"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-[rgb(170,32,47)]" : "text-slate-500 group-hover:text-slate-300")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700 font-medium">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-slate-800/50">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors",
              collapsed && "px-0 justify-center"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2 text-xs font-medium">Colapsar menú</span>}
          </Button>
        </div>
      </aside>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
             {/* Breadcrumbs o Título dinámico podría ir aquí */}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
                <Bell className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-white hover:ring-slate-100 transition-all p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[rgb(170,32,47)] text-white font-medium">
                       {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Mi Cuenta</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className={cn("flex-1 overflow-auto", noPadding ? "" : "")}>
          {children}
        </main>
      </div>
    </div>
  );
}