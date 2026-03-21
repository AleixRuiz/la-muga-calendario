"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreVertical, Search, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TeamMember = {
  id: string; // Updated to match UUID from DB
  first_name: string;
  last_name: string;
  role: string;
  email: string | null;
  phone: string | null;
  color_code: string;
};

// Map DB roles to UI labels and colors
const ROLE_MAP: Record<string, { label: string; color: string; hex: string }> = {
  'server': { label: 'Camarero', color: 'bg-blue-100 text-blue-800', hex: '#3b82f6' },
  'kitchen': { label: 'Cocina', color: 'bg-emerald-100 text-emerald-800', hex: '#10b981' },
  'general': { label: 'Personal General', color: 'bg-purple-100 text-purple-800', hex: '#a855f7' },
  'manager': { label: 'Gerente', color: 'bg-red-100 text-red-800', hex: '#ef4444' },
  'admin': { label: 'Admin', color: 'bg-gray-800 text-white', hex: '#1f2937' },
};

// Reverse map for the forms
const REVERSE_ROLE_MAP: Record<string, string> = {
  'Camarero': 'server',
  'Cocina': 'kitchen',
  'Personal General': 'general',
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setTeam(data as TeamMember[]);
      } else {
        console.error("Error fetching team:", error);
      }
      setIsLoaded(true);
    };
    
    fetchTeam();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "", // Will split into first_name and last_name
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
    const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");
    const uiRole = ROLE_MAP[member.role]?.label || "Personal General";
    
    setFormData({ 
      name: fullName, 
      role: uiRole, 
      email: member.email || "", 
      phone: member.phone || "" 
    });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este empleado?")) {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (!error) {
        setTeam(team.filter(m => m.id !== id));
      } else {
        alert("Error al eliminar: " + error.message);
      }
    }
    setActiveDropdown(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const dbRole = REVERSE_ROLE_MAP[formData.role] || 'general';
    const hexColor = ROLE_MAP[dbRole]?.hex || '#3b82f6';
    
    // Split name
    const nameParts = formData.name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

    const employeeData = {
      first_name: firstName,
      last_name: lastName,
      role: dbRole,
      email: formData.email || null,
      phone: formData.phone || null,
      color_code: hexColor
    };

    if (editingMember) {
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', editingMember.id)
        .select()
        .single();
        
      if (!error && data) {
        setTeam(team.map(m => m.id === editingMember.id ? data as TeamMember : m));
      } else if (error) {
        alert("Error actualizando: " + error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();
        
      if (!error && data) {
        setTeam([...team, data as TeamMember]);
      } else if (error) {
        alert("Error guardando: " + error.message);
      }
    }
    
    setIsSaving(false);
    setIsModalOpen(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
      </div>
    );
  }

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
              {team.map((member) => {
                const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");
                const uiRole = ROLE_MAP[member.role] || ROLE_MAP['general'];
                
                return (
                <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 uppercase">
                        {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{fullName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${uiRole.color}`}>
                      {uiRole.label}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{member.email || "-"}</td>
                  <td className="p-4 text-gray-600">{member.phone || "-"}</td>
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
              )})}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <input 
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
