import { User } from "lucide-react";

<<<<<<< HEAD
export default function GeneralLayout({ children }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <header className="bg-gray-500 text-white p-4 flex justify-between items-center">
        <span>Abitat Construction Solutions</span>
        <User className="w-6 h-6" />
      </header>
      <main className="flex-1 overflow-auto p-4">{children}</main>
      <footer className="bg-red-600 bg-opacity-50 text-white p-2 flex justify-end">
=======
export default function GeneralLayout({ children, noPadding = false }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <header className="bg-[rgb(75,80,86)] text-white p-4 flex justify-between items-center">
        <span>Abitat Construction Solutions</span>
        <User className="w-6 h-6" />
      </header>
      <main className={`flex-1 overflow-auto ${noPadding ? "" : "p-4"}`}>{children}</main>
      <footer className="bg-[rgb(170,32,47)] text-white p-2 flex justify-end">
>>>>>>> 0106298dc6c00046c1d5875dddc2a42f67a2eb6d
        <span>Abitat Construction Solutions</span>
      </footer>
    </div>
  );
}
