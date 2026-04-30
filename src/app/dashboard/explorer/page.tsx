"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Search, Filter, SortAsc, SortDesc } from "lucide-react";

export default function ProductExplorerPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filters
  const [month, setMonth] = useState("2026-04");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [salesRange, setSalesRange] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'sales', direction: 'desc' });
  const [viewMode, setViewMode] = useState<"all" | "bottom10" | "unsold">("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: prods } = await supabase
        .from("sales_products")
        .select("category, product, sales, total, month");
        
      const { data: cat, error: catError } = await supabase
        .from("sales_catalogo")
        .select("category, product, price, month")
        .limit(3000);
        
      if (catError) console.error("Error loading catalogo", catError);

      if (prods) {
        setProducts(prods);
        const uniqueCategories = Array.from(new Set(prods.map(p => p.category))).filter(Boolean) as string[];
        setCategories(uniqueCategories.sort());
      }
      
      if (cat) {
        setCatalogo(cat);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;
    
    if (viewMode === "unsold") {
      // Find products in catalogo that are NOT in sales_products for the given month
      const soldProductNames = new Set(result.filter(p => month === "ALL" ? true : (!p.month || p.month === month)).map(p => p.product?.toLowerCase()));
      const unsoldList = catalogo
        .filter(c => (month === "ALL" ? true : (!c.month || c.month === month)) && !soldProductNames.has(c.product?.toLowerCase()))
        .map(c => ({
          product: c.product,
          category: c.category,
          sales: 0,
          total: 0,
          month: c.month || month
        }));
      
      // Deduplicate unsoldList by product name
      const uniqueUnsoldMap = new Map();
      unsoldList.forEach(item => {
        uniqueUnsoldMap.set(item.product?.toLowerCase(), item);
      });
      result = Array.from(uniqueUnsoldMap.values());
      
    } else {
      if (month !== "ALL") {
        result = result.filter(p => !p.month || p.month === month);
      }
      
      if (viewMode === "bottom10") {
        // Sort ascending by sales and take top 10
        result = [...result].sort((a, b) => a.sales - b.sales).slice(0, 10);
      }
    }
    
    if (categoryFilter) {
      result = result.filter(p => p.category === categoryFilter);
    }
    
    if (salesRange) {
      result = result.filter(p => {
        const s = p.sales || 0;
        if (salesRange === "1") return s === 1;
        if (salesRange === "1-5") return s >= 1 && s <= 5;
        if (salesRange === "5-20") return s >= 5 && s <= 20;
        if (salesRange === "20-50") return s >= 20 && s <= 50;
        if (salesRange === "50-100") return s >= 50 && s <= 100;
        if (salesRange === "100+") return s >= 100;
        return true;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.product?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    
    if (viewMode !== "bottom10") {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [products, catalogo, month, categoryFilter, searchQuery, sortConfig, viewMode, salesRange]);

  const requestSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />;
  };

  return (
    <div className="flex-1 bg-gray-50/50 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 relative h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Explorador de Productos
          </h1>
          <div className="flex flex-wrap items-center bg-gray-100 p-1 rounded-lg gap-1">
            <button onClick={() => setViewMode("all")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
            <button onClick={() => setViewMode("bottom10")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'bottom10' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Top 10 menos vendidos</button>
            <button onClick={() => setViewMode("unsold")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'unsold' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Productos no vendidos (0)</button>
          </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar por producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="ALL">Todos los meses</option>
          <option value="2026-03">Marzo 2026</option>
          <option value="2026-04">Abril 2026</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Todas las Categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={salesRange}
          onChange={(e) => setSalesRange(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">Cualquier cantidad</option>
          <option value="1">1 Venta</option>
          <option value="1-5">De 1 a 5</option>
          <option value="5-20">De 5 a 20</option>
          <option value="20-50">De 20 a 50</option>
          <option value="50-100">De 50 a 100</option>
          <option value="100+">Más de 100</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="hidden md:table-header-group">
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('product')}>
                    <div className="flex items-center gap-2">Producto {getSortIcon('product')}</div>
                  </th>
                  <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('category')}>
                    <div className="flex items-center gap-2">Categoría {getSortIcon('category')}</div>
                  </th>
                  <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('sales')}>
                    <div className="flex items-center gap-2">Ventas {getSortIcon('sales')}</div>
                  </th>
                  <th className="p-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => requestSort('total')}>
                    <div className="flex items-center gap-2">Total (€) {getSortIcon('total')}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {filteredAndSortedProducts.length === 0 ? (
                  <tr className="block md:table-row">
                    <td colSpan={4} className="block md:table-cell p-6 text-center text-gray-500">
                      No se encontraron resultados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedProducts.map((p, i) => (
                    <tr key={i} className="block md:table-row border-b border-gray-100 hover:bg-gray-50 transition-colors p-4 md:p-0">
                      <td className="block md:table-cell p-1 md:p-4">
                        <div className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Producto</div>
                        <div className="font-medium text-gray-800">{p.product}</div>
                      </td>
                      <td className="block md:table-cell p-1 md:p-4">
                        <div className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Categoría</div>
                        <div className="text-sm text-gray-500">{p.category}</div>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-1 md:p-4">
                        <div className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas</div>
                        <div className="font-semibold">{p.sales}</div>
                      </td>
                      <td className="flex md:table-cell justify-between items-center p-1 md:p-4">
                        <div className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</div>
                        <div className="text-emerald-600 font-semibold">{Number(p.total).toFixed(2)} €</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
