import { User } from "lucide-react";


export default function GeneralLayout({ children, noPadding = false }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <header className="bg-[rgb(75,80,86)] text-white p-4 flex justify-between items-center">
        <span>Abitat Construction Solutions</span>
        <User className="w-6 h-6" />
      </header>
      <main className={`flex-1 overflow-auto ${noPadding ? "" : "p-4"}`}>{children}</main>
      <footer className="bg-[rgb(170,32,47)] text-white p-2 flex justify-end">

        <span>Abitat Construction Solutions</span>
      </footer>
    </div>
  );
}
