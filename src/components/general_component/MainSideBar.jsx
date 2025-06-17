import { Link } from "react-router-dom";
import { Layers } from "lucide-react";

export default function MainSideBar() {
  return (
    <aside className="bg-gray-500 text-white w-60 p-4">
      <div className="flex items-center space-x-2">
        <Layers className="w-5 h-5" />
        <Link to="/aec-model" className="font-medium">
          Plans Module
        </Link>
      </div>
    </aside>
  );
}
