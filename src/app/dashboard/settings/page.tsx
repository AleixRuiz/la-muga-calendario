"use client";

import React, { useState } from "react";
import { Save, Clock, Users, CalendarDays } from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState({
    barName: "Mi Excelente Bar",
    openHour: "08:00",
    closeHour: "02:00",
    maxCapacity: 10,
    daysOpen: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  });

  const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const toggleDay = (day: string) => {
    setConfig(prev => ({
      ...prev,
      daysOpen: prev.daysOpen.includes(day)
        ? prev.daysOpen.filter(d => d !== day)
        : [...prev.daysOpen, day],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-6 pb-20 md:pb-6 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del Local</h1>
        <p className="text-gray-500">Ajusta los detalles de tu establecimiento, horarios y reglas de asignación.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 space-y-4 md:space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CalendarDays className="text-blue-500" /> Días de Operación
        </h2>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {weekDays.map(day => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                config.daysOpen.includes(day)
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="text-emerald-500" /> Horario Base
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Apertura</label>
              <input 
                type="time" 
                value={config.openHour}
                onChange={(e) => setConfig({...config, openHour: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Cierre</label>
              <input 
                type="time" 
                value={config.closeHour}
                onChange={(e) => setConfig({...config, closeHour: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="text-purple-500" /> Reglas de Turno
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Máximo por Turno
              </label>
              <input 
                type="number" 
                value={config.maxCapacity}
                onChange={(e) => setConfig({...config, maxCapacity: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-2">
                Cuántos empleados como máximo esperas tener trabajando en el bar al mismo tiempo.
              </p>
            </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 md:py-2 rounded-md font-medium flex items-center justify-center gap-2">
          <Save size={20} /> Guardar Configuración
        </button>
      </div>

    </div>
  );
}