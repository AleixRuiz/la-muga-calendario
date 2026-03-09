"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreVertical, Search, Edit2, Trash2, X } from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  color: string;
  hex: string;
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from fake database (LocalStorage) over session
    const storedTeam = localStorage.getItem("staff-app-team");
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam));
    } else {
      const defaultTeam: TeamMember[] = [
        { id: 1, name: "Juan Pérez", role: "Camarero", email: "juan@bar.com", phone: "+34 600 123 456", color: "bg-blue-100 text-blue-800", hex: "#3b82f6" },
        { id: 2, name: "Ana Gómez", role: "Cocina", email: "ana@bar.com", phone: "+34 600 987 654", color: "bg-emerald-100 text-emerald-800", hex: "#10b981" },
        { id: 3, name: "Carlos Ruiz", role: "Personal General", email: "carlos@bar.com", phone: "+34 600 111 222", color: "bg-purple-100 text-purple-800", hex: "#a855f7" },
        { id: 4, name: "Lucía Fernández", role: "Camarero", email: "lucia@bar.com", phone: "+34 600 333 444", color: "bg-blue-100 text-blue-800", hex: "#3b82f6" },
        { id: 5, name: "Miguel Torres", role: "Cocina", email: "miguel@bar.com", phone: "+34 600 555 666", color: "bg-emerald-100 text-emerald-800", hex: "#10b981" },
        { id: 6, name: "Elena Vargas", role: "Personal General", email: "elena@bar.com", phone: "+34 600 777 888", color: "bg-purple-100 text-purple-800", hex: "#a855f7" },
      ];
      setTeam(defaultTeam);
      localStorage.setItem("staff-app-team", JSON.stringify(defaultTeam));
    }
    setIsLoaded(true);
  }, []);

  const saveTeam = (newTeam: TeamMember[]) => {
    setTeam(newTeam);
    localStorage.setItem("staff-app-team", JSON.stringify(newTeam));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "Camarero",
    email: "",
    phone: ""
  });

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData({ name: "", role: "Camarero", email: "", phone: "" });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({ name: member.name, role: member.role, email: member.email, phone: member.phone });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este empleado?")) {
      saveTeam(team.filter(m => m.id !== id));
    }
    setActiveDropdown(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roleConfig: Record<string, {color: string, hex: string}> = {
      "Camarero": { color: "bg-blue-100 text-blue-800", hex: "#3b82f6" },
      "Cocina": { color: "bg-emerald-100 text-emerald-800", hex: "#10b981" },
      "Personal General": { color: "bg-purple-100 text-purple-800", hex: "#a855f7" }
    };
    
    const selectedRole = roleConfig[formData.role] || { color: "bg-gray-100 text-gray-800", hex: "#6b7280" };

    if (editingMember) {
      saveTeam(team.map(m => m.id === editingMember.id ? { 
        ...m, 
        ...formData, 
        color: selectedRole.color,
        hex: selectedRole.hex
      } : m));
    } else {
      const newId = team.length > 0 ? Math.max(...team.map(m => m.id)) + 1 : 1;
      saveTeam([...team, { 
        id: newId, 
        ...formData, 
        color: selectedRole.color,
        hex: selectedRole.hex
      }]);
    }
    setIsModalOpen(false);
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-6 pb-20 md:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-gray-500">Gestiona los miembros de tu personal y sus roles.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> Añadir Empleado
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Buscar empleado..." 
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Rol</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Teléfono</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 uppercase">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.color}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{member.email}</td>
                  <td className="p-4 text-gray-600">{member.phone}</td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === member.id ? null : member.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {activeDropdown === member.id && (
                      <div className="absolute right-8 top-10 bg-white border border-gray-200 shadow-lg rounded-md w-36 z-10 overflow-hidden flex flex-col items-start py-1">
                        <button 
                          onClick={() => openEditModal(member)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit2 size={16} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {team.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No hay empleados registrados. Añade uno nuevo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay para Crear/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMember ? "Editar Empleado" : "Nuevo Empleado"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Camarero">Camarero</option>
                  <option value="Cocina">Cocina</option>
                  <option value="Personal General">Personal General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  required
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
