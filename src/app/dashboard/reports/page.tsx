"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, TrendingUp, Clock, Receipt, Utensils, CalendarDays, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#f43f5e', '#a855f7', '#ec4899', '#FF8042', '#14b8a6'];

const WEEKS_MAP = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    ticketAverage: 0,
    totalTickets: 0
  });
  
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [dailyTrendData, setDailyTrendData] = useState<any[]>([]);
  const [weekDayData, setWeekDayData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      
      // 1. Fetch ALL tickets bypassing the 1000 limit
      let allTickets: any[] = [];
      let hasMore = true;
      let page = 0;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from("sales_tickets")
          .select("total, time, date")
          .range(page * 1000, (page + 1) * 1000 - 1);
          
        if (error) {
          console.error("Error fetching tickets:", error);
          break;
        }
        
        if (data && data.length > 0) {
          allTickets = [...allTickets, ...data];
          if (data.length < 1000) {
            hasMore = false; // Finished
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      
      let totSales = 0;
      const hourCounts: Record<string, number> = {};
      const dateCounts: Record<string, number> = {};
      const weekDayCounts: Record<string, number> = {};

      allTickets.forEach(t => {
        const amt = Number(t.total) || 0;
        totSales += amt;
        
        if (t.time) {
          const hour = t.time.split(':')[0] + ":00";
          hourCounts[hour] = (hourCounts[hour] || 0) + amt;
        }
        
        if (t.date) {
            dateCounts[t.date] = (dateCounts[t.date] || 0) + amt;
            
            // Get week day name
            const d = new Date(t.date);
            if (!isNaN(d.getTime())) {
                const dayName = WEEKS_MAP[d.getDay()];
                weekDayCounts[dayName] = (weekDayCounts[dayName] || 0) + amt;
            }
        }
      });

      setMetrics({
        totalSales: totSales,
        totalTickets: allTickets.length,
        ticketAverage: allTickets.length > 0 ? totSales / allTickets.length : 0
      });

      // Format Chart Data
      setHourlyData(Object.keys(hourCounts).sort().map(h => ({ hour: h, sales: hourCounts[h] })));
      setDailyTrendData(Object.keys(dateCounts).sort().map(d => ({ date: d.substring(5), sales: dateCounts[d] })));
      
      // Order days of week
      const formattedWeekDays = WEEKS_MAP.map(day => ({ day, sales: weekDayCounts[day] || 0 })).filter(d => d.sales > 0);
      const sortedWeekDays = formattedWeekDays.sort((a,b) => {
         const wa = a.day === 'Domingo' ? 7 : WEEKS_MAP.indexOf(a.day);
         const wb = b.day === 'Domingo' ? 7 : WEEKS_MAP.indexOf(b.day);
         return wa - wb;
      });
      setWeekDayData(sortedWeekDays);

      // 2. Fetch Top Categories
      const { data: categories } = await supabase
        .from("sales_categories")
        .select("category, total")
        .order("total", { ascending: false });
        
      if (categories) {
        setCategoryData(categories.map(c => ({ name: c.category, value: Number(c.total) })));
      }

      // 3. Fetch Top Products
      const { data: products } = await supabase
        .from("sales_products")
        .select("product, total, category")
        .order("total", { ascending: false })
        .limit(10);

      if (products) {
        setTopProducts(products);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[60vh] w-full gap-4 text-blue-500">
        <Loader2 className="animate-spin h-10 w-10" />
        <p className="font-medium animate-pulse text-sm">Cargando miles de registros de ventas...</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 relative h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Análisis de Negocio
          </h1>
          <div className="bg-white border rounded-lg px-4 py-2 shadow-sm text-sm font-medium text-blue-700 flex items-center gap-2 border-blue-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Histórico Completo ({metrics.totalTickets} tickets)
          </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ventas Totales</p>
            <p className="text-xl md:text-3xl font-bold text-gray-900">{formatCurrency(metrics.totalSales)}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex justify-center items-center text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Tickets</p>
            <p className="text-xl md:text-3xl font-bold text-gray-900">{metrics.totalTickets}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-xl flex justify-center items-center text-emerald-600">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ticket Medio</p>
            <p className="text-xl md:text-3xl font-bold text-gray-900">{formatCurrency(metrics.ticketAverage)}</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 rounded-xl flex justify-center items-center text-amber-600">
            <Utensils size={24} />
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Hora Pico</p>
            <p className="text-xl md:text-3xl font-bold text-gray-900">
              {hourlyData.length > 0 ? [...hourlyData].sort((a,b)=>b.sales - a.sales)[0].hour : '--:--'}
            </p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-xl flex justify-center items-center text-purple-600">
            <Clock size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Trend Area Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <TrendingUp className="text-blue-500" size={20} /> Evolución de Ingresos
          </h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                />
                <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Days of Week Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <CalendarDays className="text-indigo-500" size={20} /> Rentabilidad por Día
          </h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekDayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `€${val}`} />
                <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12, fontWeight: 600}} width={80} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas Totales']}
                />
                <Bar dataKey="sales" radius={[0, 6, 6, 0]} maxBarSize={25}>
                  {weekDayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Heatmap Equivalent */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <Clock className="text-amber-500" size={20} /> Ventas Mapeadas por Horario
          </h3>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}} 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => `${label} - ${parseInt(label)+1}:00`}
                />
                <Bar dataKey="sales" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Pie Chart */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
            <PieChartIcon className="text-emerald-500" size={20} /> Distribución de Categorías
          </h3>
          <div className="h-[200px] md:h-[250px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    nameKey="name"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => formatCurrency(value)} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-gray-400">Sin datos registrados</div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-sm mx-auto">
            {categoryData.slice(0,6).map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-100">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Products Table */}
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 px-1 flex items-center gap-2">
           <Utensils className="text-pink-500" size={20} /> Los 10 Productos Estrella
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider font-bold">
                <th className="py-4 px-6">Ranking</th>
                <th className="py-4 px-6">Producto</th>
                <th className="py-4 px-6 hidden md:table-cell">Categoría</th>
                <th className="py-4 px-6 text-right">Facturación</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-rose-50/30 transition-colors group">
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold shadow-sm ${
                      i === 0 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900 border border-amber-300' :
                      i === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-800 border border-gray-300' :
                      i === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-300 text-orange-900 border border-orange-300' :
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-6 font-semibold text-gray-800">{p.product}</td>
                  <td className="py-3 px-6 hidden md:table-cell">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-200">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right font-bold text-emerald-600 text-base">
                    {formatCurrency(p.total)}
                  </td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-gray-400 text-sm font-medium">
                    No hay productos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}