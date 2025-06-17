import { Link } from "react-router-dom";
import { User, Layers } from "lucide-react";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <aside className="bg-gray-500 text-white w-60 p-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5" />
          <Link to="/aec-model" className="font-medium">
            Plans Module
          </Link>
        </div>
      </aside>
      <div className="flex flex-col flex-1">
        <header className="bg-gray-500 text-white p-4 flex justify-between items-center">
          <span>Abitat Construction Solutions</span>
          <User className="w-6 h-6" />
        </header>
        <main className="flex-1 overflow-auto p-4">{children}</main>
        <footer className="bg-red-600 bg-opacity-50 text-white p-2 flex justify-end">
          <span>Abitat Construction Solutions</span>
        </footer>
      </div>
    </div>
  );
}
