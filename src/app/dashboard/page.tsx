"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Map DB roles to Spanish UI labels
const ROLE_MAP: Record<string, string> = {
  'server': "Camarero",
  'kitchen': "Cocina",
  'general': "Personal General",
  'manager': "Gerente",
  'admin': "Admin",
};

export default function DashboardCalendarPage() {
  const externalEventsRef = useRef<HTMLDivElement>(null);

  const [team, setTeam] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [barConfig, setBarConfig] = useState({ open: "08:00:00", close: "24:00:00" });

  useEffect(() => {
    const fetchData = async () => {
      const { data: configData } = await supabase.from('bar_config').select('*').limit(1).maybeSingle();
      if (configData) {
        setBarConfig({
          open: configData.opening_time || "08:00:00",
          close: configData.closing_time || "24:00:00"
        });
      }

      // 1. Fetch employees
      const { data: employeesData } = await supabase.from('employees').select('*');
      if (employeesData) {
        setTeam(employeesData.map(emp => ({
          id: emp.id,
          name: [emp.first_name, emp.last_name].filter(Boolean).join(" "),
          role: ROLE_MAP[emp.role] || "Personal General",
          db_role: emp.role, 
          hex: emp.color_code || "#3b82f6",
        })));
      }

      // 2. Fetch shifts
      const { data: shiftsData } = await supabase.from('shifts').select('*, employees(first_name, last_name, color_code)');
      if (shiftsData) {
        setEvents(shiftsData.map((shift: any) => ({
          id: shift.id,
          title: shift.employees ? `${shift.employees.first_name}` : 'Turno',
          start: shift.start_time,
          end: shift.end_time,
          backgroundColor: shift.employees?.color_code || '#3b82f6',
          extendedProps: {
            user_id: shift.user_id,
            role_assigned: shift.role_assigned,
          }
        })));
      }
      setIsLoaded(true);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let draggable: Draggable | null = null;
    if (isLoaded && externalEventsRef.current && team.length > 0) {
      draggable = new Draggable(externalEventsRef.current, {
        itemSelector: ".fc-event",
        longPressDelay: 250,
        eventData: function (eventEl) {
          return {
            title: eventEl.innerText,
            backgroundColor: eventEl.getAttribute("data-color"),
            duration: "08:00",
            extendedProps: {
              user_id: eventEl.getAttribute("data-id"),
              role: eventEl.getAttribute("data-role"),
            }
          };
        }
      });
    }

    return () => {
      if (draggable) draggable.destroy();
    };
  }, [team, isLoaded]);

  const handleEventDrop = async (info: any) => {
    const shiftId = info.event.id;
    const { error } = await supabase.from('shifts')
      .update({
        start_time: info.event.startStr,
        end_time: info.event.endStr || new Date(info.event.start.getTime() + 8 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', shiftId);

    if (error) {
      alert("Error al mover el turno");
      info.revert();
    } else {
      setEvents((prev) => prev.map(ev =>
        ev.id === shiftId
          ? { ...ev, start: info.event.startStr, end: info.event.endStr || ev.end }
          : ev
      ));
    }
  };

  const handleEventResize = async (info: any) => {
    const shiftId = info.event.id;
    
    // Fallback just in case, but resize should usually have an end limit naturally given by the UI
    const updatedEndStr = info.event.endStr || new Date(info.event.start.getTime() + 8 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase.from('shifts')
      .update({
        start_time: info.event.startStr,
        end_time: updatedEndStr,
      })
      .eq('id', shiftId);

    if (error) {
      alert("Error al redimensionar el turno");
      info.revert();
    } else {
      setEvents((prev) => prev.map(ev =>
        ev.id === shiftId
          ? { ...ev, start: info.event.startStr, end: updatedEndStr }
          : ev
      ));
    }
  };

  const handleEventReceive = async (info: any) => {
    const userId = info.event.extendedProps.user_id;
    const userRole = info.event.extendedProps.role || 'general';
    const newStart = info.event.startStr;
    const newEnd = info.event.endStr || new Date(info.event.start.getTime() + 8 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.from('shifts').insert([{
      user_id: userId,
      start_time: newStart,
      end_time: newEnd,
      role_assigned: userRole
    }]).select().single();

    if (data && !error) {
      setEvents((prev) => [
        ...prev,
        {
          id: data.id,
          title: info.event.title,
          start: data.start_time,
          end: data.end_time,
          backgroundColor: info.event.backgroundColor,
          extendedProps: { user_id: data.user_id }
        }
      ]);
    } else {
      alert("Error al asignar el turno");
    }
    info.revert();
  };

  const handleEventClick = async (clickInfo: any) => {
    if (confirm('¿Estás seguro de que quieres eliminar este turno?')) {
      const { error } = await supabase.from('shifts').delete().eq('id', clickInfo.event.id);
      
      if (!error) {
        setEvents((prev) => prev.filter(event => event.id !== clickInfo.event.id));
      } else {
        alert("Error al eliminar");
      }
    }
  };

  // Helper to format late-night hours properly for FullCalendar (e.g. 02:00 -> 26:00)
  const getSlotMaxTime = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 0 && hour <= 6) {
      return `${hour + 24}:00:00`;
    }
    return time;
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row h-auto min-h-max xl:h-[calc(100vh-140px)] w-full gap-4 md:gap-6 relative z-0 pb-10">
      <div
        ref={externalEventsRef}
        className="w-full xl:w-64 bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col flex-shrink-0"
      >
        <h3 className="font-semibold text-gray-700 mb-2 md:mb-4 text-sm uppercase tracking-wider hidden xl:block">Personal</h3>
        
        <div className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-y-auto pb-2 xl:pb-0 xl:pr-2 snap-x" style={{ scrollbarWidth: 'none', touchAction: 'pan-x pan-y' }}>
          {team.map((member) => (
            <div
              key={member.id}
              data-id={member.id}
              data-role={member.db_role}
              className="fc-event cursor-move py-1.5 px-2.5 md:p-3 border rounded-full xl:rounded-lg font-medium flex items-center gap-2 flex-shrink-0 snap-start"
              data-color={member.hex || "#6b7280"}
              style={{ backgroundColor: member.hex ? `${member.hex}15` : '#f3f4f6', borderColor: member.hex ? `${member.hex}40` : '#e5e7eb', color: member.hex }}
            >
              <div
                className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-white uppercase text-[10px] md:text-xs flex-shrink-0 shadow-sm"
                style={{ backgroundColor: member.hex || "#6b7280" }}
              >
                {member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="pr-1 md:pr-0">
                <div className="whitespace-nowrap font-semibold text-gray-800 text-[11px] sm:text-sm">{member.name.split(' ')[0]}</div>
                <div className="text-[10px] font-normal opacity-80 xl:block hidden text-gray-600">{member.role}</div>
              </div>
            </div>
          ))}
          {team.length === 0 && (
            <div className="text-xs text-gray-400 text-center mt-4">
              Ve a &quot;Equipo&quot; para añadir personal
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white p-3 md:p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col min-h-[600px]">
        <FullCalendar
          locale={esLocale}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          initialView="timeGridWeek"
          editable={true} 
          droppable={true} 
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={events}
          eventDrop={handleEventDrop}
          eventReceive={handleEventReceive}
          eventClick={handleEventClick}
          eventResize={handleEventResize}
          height="100%"
          slotMinTime={barConfig.open}
          slotMaxTime={getSlotMaxTime(barConfig.close)}
          longPressDelay={250}
          eventLongPressDelay={250}
          selectLongPressDelay={250}
        />
      </div>
    </div>
  );
}
