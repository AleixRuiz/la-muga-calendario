"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, TrendingUp, Clock, Receipt, Utensils } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    ticketAverage: 0,
    totalTickets: 0
  });
  
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch tickets to calculate total sales, average ticket and peak hours
      const { data: tickets } = await supabase.from("sales_tickets").select("total, time, date");
      
      let totSales = 0;
      const hourCounts: Record<string, number> = {};

      if (tickets) {
        tickets.forEach(t => {
          if (t.total) totSales += Number(t.total);
          if (t.time) {
            const hour = t.time.split(':')[0] + ":00";
            hourCounts[hour] = (hourCounts[hour] || 0) + (Number(t.total) || 0);
          }
        });

        setMetrics({
          totalSales: totSales,
          totalTickets: tickets.length,
          ticketAverage: tickets.length > 0 ? totSales / tickets.length : 0
        });

        // Convert hours to chart format
        const hData = Object.keys(hourCounts)
          .sort()
          .map(h => ({ hour: h, sales: hourCounts[h] }));
        setHourlyData(hData);
      }

      // 2. Fetch Top Categories
      const { data: categories } = await supabase
        .from("sales_categories")
        .select("category, total")
        .order("total", { ascending: false })
        .limit(5);
        
      if (categories) {
        setCategoryData(categories.map(c => ({ name: c.category, value: Number(c.total) })));
      }

      // 3. Fetch Top Products
      const { data: products } = await supabase
        .from("sales_products")
        .select("product, total, category")
        .order("total", { ascending: false })
        .limit(8);

      if (products) {
        setTopProducts(products);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh] w-full">
        <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 relative h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Panel de Informes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Ventas Totales</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalSales)}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex justify-center items-center text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Tickets</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalTickets}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex justify-center items-center text-emerald-600">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Ticket Medio</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.ticketAverage)}</p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-full flex justify-center items-center text-amber-600">
            <Utensils size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Peak Hours Chart */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <Clock className="text-blue-500" size={20} /> Ventas por Hora
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(val) => `€${val}`} />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}} 
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={(label) => `${label} - ${parseInt(label)+1}:00`}
                />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Pie Chart */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-500" size={20} /> Categorías Principales
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
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
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-gray-400">Sin datos registrados</div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Top Products Table */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 px-1">Productos más vendidos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 text-sm font-medium">
                <th className="py-3 px-4 rounded-tl-lg">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right rounded-tr-lg">Facturación</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800">{p.product}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-600">
                    {formatCurrency(p.total)}
                  </td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400 text-sm">
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
