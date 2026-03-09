import { Calendar, Users, Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50 h-screen w-full overflow-hidden">
      {/* Sidebar Navigation (Hidden on mobile) */}
      <aside className="w-64 bg-white border-r shadow-sm hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-gray-800">Gestor de Personal</h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <a href="/dashboard" className="block px-4 py-2 rounded bg-blue-50 text-blue-700 font-medium">Calendario</a>
          <a href="/dashboard/team" className="block px-4 py-2 rounded hover:bg-gray-50 text-gray-700">Equipo</a>
          <a href="/dashboard/settings" className="block px-4 py-2 rounded hover:bg-gray-50 text-gray-700">Configuración</a>
        </nav>
        <div className="p-4 border-t">
          <div className="text-sm font-medium text-gray-900">Usuario Admin</div>
          <div className="text-xs text-gray-500">Rol: Gerente</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-16 md:pb-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 shadow-sm flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">Horario Semanal</h2>
          <h2 className="text-lg font-semibold text-gray-800 sm:hidden">Gestor</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
            Publicar Turnos
          </button>
        </header>
        <div className="flex-1 p-3 md:p-6 overflow-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Layout */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-white border-t flex justify-around items-center text-xs text-gray-600 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
        <a href="/dashboard" className="flex flex-col items-center gap-1 p-2 w-full text-center hover:text-blue-600 focus:text-blue-600 active:bg-blue-50 transition-colors">
          <Calendar size={22} />
          <span className="font-medium">Turnos</span>
        </a>
        <a href="/dashboard/team" className="flex flex-col items-center gap-1 p-2 w-full text-center hover:text-blue-600 focus:text-blue-600 active:bg-blue-50 transition-colors relative">
          <Users size={22} />
          <span className="font-medium">Equipo</span>
        </a>
        <a href="/dashboard/settings" className="flex flex-col items-center gap-1 p-2 w-full text-center hover:text-blue-600 focus:text-blue-600 active:bg-blue-50 transition-colors">
          <Settings size={22} />
          <span className="font-medium">Ajustes</span>
        </a>
      </nav>
    </div>
  );
}
