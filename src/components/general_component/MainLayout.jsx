import { User } from "lucide-react";
import MainSideBar from "@/components/general_component/MainSideBar";

export default function MainLayout({ children }) {
  return (

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

        <span>Abitat Construction Solutions</span>
      </footer>
    </div>
  );
}
