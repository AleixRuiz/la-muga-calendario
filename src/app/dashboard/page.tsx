"use client";

import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

export default function DashboardCalendarPage() {
  const externalEventsRef = useRef<HTMLDivElement>(null);

  const [team, setTeam] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load team and events from fake database (LocalStorage)
  useEffect(() => {
    const storedTeam = localStorage.getItem("staff-app-team");
    if (storedTeam) {
      setTeam(JSON.parse(storedTeam));
    } else {
      // Default fallback if visiting calendar first
      const defaultTeam = [
        { id: 1, name: "Juan Pérez", role: "Camarero", hex: "#3b82f6" },
        { id: 2, name: "Ana Gómez", role: "Cocina", hex: "#10b981" },
        { id: 3, name: "Carlos Ruiz", role: "Personal General", hex: "#a855f7" },
        { id: 4, name: "Lucía Fernández", role: "Camarero", hex: "#3b82f6" },
        { id: 5, name: "Miguel Torres", role: "Cocina", hex: "#10b981" },
        { id: 6, name: "Elena Vargas", role: "Personal General", hex: "#a855f7" },
      ];
      setTeam(defaultTeam);
    }

    const storedEvents = localStorage.getItem("staff-app-events");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      // Fallback sample events Let's leave it empty to test dropping
      setEvents([]);
    }
    
    setIsLoaded(true);
  }, []);

  // Save events whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("staff-app-events", JSON.stringify(events));
    }
  }, [events, isLoaded]);

        // Make the external list draggable - re-initialize when team updates
  useEffect(() => {
    let draggable: Draggable | null = null;
    if (externalEventsRef.current && team.length > 0) {
      draggable = new Draggable(externalEventsRef.current, {
        itemSelector: ".fc-event",
        longPressDelay: 250, // Allows touch and drag
        eventData: function (eventEl) {
          // Provide default duration
          return {
            title: eventEl.innerText,
            backgroundColor: eventEl.getAttribute("data-color"),
            duration: "08:00", // Default to 8 hour shift
          };
        }
      });
    }

    return () => {
      if (draggable) {
        draggable.destroy();
      }
    };
  }, [team]);

  const handleEventDrop = (info: any) => {
    // Fired when dragging an existing shift backwards or forwards in time
    console.log("Existing event dropped:", info.event.title, "New start:", info.event.start);
    
    // Update the event in our state
    setEvents((prev) => prev.map(ev => 
      ev.id === info.event.id
        ? { 
            ...ev, 
            start: info.event.startStr, 
            end: info.event.endStr || ev.end 
          }
        : ev
    ));
  };

  const handleEventReceive = (info: any) => {
    // Fired when an external team member is dropped ONTO the calendar
    console.log("New staff member placed on shift:", info.event.title);
    setEvents((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr || new Date(info.event.start.getTime() + 8 * 60 * 60 * 1000).toISOString(),
        backgroundColor: info.event.backgroundColor,
      }
    ]);
    info.revert(); // Let React control state rendering
  };

  const handleEventClick = (clickInfo: any) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el turno de '${clickInfo.event.title}'?`)) {
      setEvents((prev) => prev.filter(event => event.id !== clickInfo.event.id));
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    let title = prompt("Introduce una tarea o el nombre para un turno sin asignar:");
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    if (title) {
      setEvents([
        ...events,
        {
          id: String(Date.now()),
          title,
          start: selectInfo.startStr,
          end: selectInfo.endStr,
          // @ts-ignore
          allDay: selectInfo.allDay,
        },
      ]);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col xl:flex-row h-auto min-h-max xl:h-[calc(100vh-140px)] w-full gap-4 md:gap-6 relative z-0 pb-10">
      
      {/* Sidebar for Draggable Staff */}
      <div 
        ref={externalEventsRef}
        className="w-full xl:w-64 bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col flex-shrink-0"
      >
        <h3 className="font-semibold text-gray-700 mb-2 md:mb-4 text-sm uppercase tracking-wider hidden xl:block">Personal Disponible</h3>
        <p className="text-xs text-gray-500 mb-2 md:mb-4 hidden xl:block">Arrastra y suelta en el calendario para asignar un turno</p>
        
        {/* Mobile helper text */}
        <div className="text-[10px] sm:text-xs font-medium mb-3 xl:hidden text-center bg-blue-50 text-blue-700 py-1.5 px-3 rounded-md border border-blue-100">
          Mantén presionado un empleado, desliza y suelta en el calendario ↓
        </div>
        
        {/* Horizontal scroll container on mobile, vertical on desktop */}
        <div className="flex xl:flex-col gap-2 overflow-x-auto xl:overflow-y-auto pb-2 xl:pb-0 xl:pr-2 snap-x" style={{ scrollbarWidth: 'none', touchAction: 'pan-x pan-y' }}>
          {team.map((member) => (
            <div 
              key={member.id}
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
                <div className="whitespace-nowrap font-semibold text-gray-800 text-[11px] sm:text-sm">{member.name.split(' ')[0]} {member.name.split(' ')[1] ? member.name.split(' ')[1][0] + '.' : ''}</div>
                <div className="text-[10px] font-normal opacity-80 xl:block hidden text-gray-600">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Calendar View */}
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
          editable={true} // Extends / Trims, Drag and drop shifts
          droppable={true} // Allow external drops
          selectable={true} // Allows creating specific bounding box shifts
          selectMirror={true}
          dayMaxEvents={true}
          events={events} // Load shifts
          select={handleDateSelect}
          eventDrop={handleEventDrop} // Handle existing shift time updates via drag and drop
          eventReceive={handleEventReceive} // Handle staff dropped onto calendar
          eventClick={handleEventClick} // Handle clicking to remove shifts
          height="100%"
          slotMinTime="08:00:00"
          slotMaxTime="24:00:00"
          longPressDelay={250} // Important for touch devices
          eventLongPressDelay={250}
          selectLongPressDelay={250}
        />
      </div>
    </div>
  );
}
