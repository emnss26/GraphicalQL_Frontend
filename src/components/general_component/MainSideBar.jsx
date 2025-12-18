import React from "react"
import { Link } from "react-router-dom"
import { Home, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Sheets Module",
    url: "/aec-model",
    icon: FileSpreadsheet,
  },
]

export default function MainSideBar() {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        "bg-gray-100 border-r border-gray-200 flex flex-col transition-all",
        collapsed ? "w-15" : "w-45"
      )}
    >
      <div className="border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <span className={cn("font-semibold text-gray-800", collapsed && "hidden")}>Modules</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-700 hover:bg-red-500 hover:text-white transition-colors duration-200 h-8 w-8 flex items-center justify-center rounded"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <nav className="p-2 flex-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className="flex items-center gap-3 text-gray-700 rounded p-2 hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span className="font-medium">{item.title}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )

}
