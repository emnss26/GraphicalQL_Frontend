import { User } from "lucide-react";
import MainSideBar from "@/components/general_component/MainSideBar";

export default function MainLayout({ children }) {
  return (
<<<<<<< HEAD
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <header className="bg-gray-500 text-white p-4 flex justify-between items-center">
        <span>Abitat Construction Solutions</span>
        <User className="w-6 h-6" />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <MainSideBar />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
      <footer className="bg-red-600 bg-opacity-50 text-white p-2 flex justify-end">
=======
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-[rgb(75,80,86)] text-white p-4 flex justify-between items-center">
        <span>Abitat Construction Solutions</span>
        <User className="w-6 h-6" />
      </header>
      <div className="flex flex-1 ">
        <MainSideBar />
        <main className="flex-1  p-4 bg-white">
          {children}
        </main>
      </div>
      <footer className="bg-[rgb(170,32,47)] text-white p-2 flex justify-end">
>>>>>>> 0106298dc6c00046c1d5875dddc2a42f67a2eb6d
        <span>Abitat Construction Solutions</span>
      </footer>
    </div>
  );
}
