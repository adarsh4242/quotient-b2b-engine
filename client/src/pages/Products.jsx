import { useEffect, useState } from 'react';
import { ArrowUpRight, Boxes, LoaderCircle, Search } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import NegotiationSlideOver from '../components/NegotiationSlideOver';
import SupplierBadge from '../components/SupplierBadge';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    setError('');
    api.get('/api/products')
      .then(({ data }) => setProducts(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load products. Please sign in again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'); const updateStock = (update) => { setProducts((current) => current.map((item) => item._id === update.productId ? { ...item, ...update } : item)); setSelected((current) => current?._id === update.productId ? { ...current, ...update } : current); }; socket.on('stock_level_updated', updateStock); return () => socket.disconnect(); }, []);
  const filtered = products.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase()) && (!verifiedOnly || product.supplierId?.isVerified));
  const stockStatus = (product) => { const available = product.availableStock ?? Math.max(0, (product.currentStock || 0) - (product.reservedStock || 0)); if (!available) return { label: 'Backorder required', className: 'bg-red-100 text-red-800' }; if (available <= (product.reorderPoint || 0)) return { label: 'Low stock', className: 'bg-orange-100 text-orange-800' }; return { label: 'In stock', className: 'bg-mint text-emerald-800' }; };

  return <div className="page-wrap"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Commercial catalog</p><h1 className="mt-2 font-display text-4xl font-bold text-ink">Find your next advantage.</h1><p className="mt-2 text-slate-500">Select an item and put a number on the table.</p></div><div className="flex flex-col gap-3 sm:items-end"><label className="flex items-center gap-2 text-sm font-bold text-ink"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} className="h-4 w-4 accent-coral" />Verified suppliers only</label><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input className="input w-full pl-10 sm:w-64" placeholder="Search catalog" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div></div>
    {loading ? <div className="mt-20 flex justify-center"><LoaderCircle className="animate-spin text-coral" /></div> : error ? <div className="mt-10 border border-red-200 bg-red-50 p-6 text-sm text-red-800"><p className="font-bold">Catalog unavailable</p><p className="mt-2">{error}</p><button onClick={loadProducts} className="mt-4 bg-ink px-4 py-2 font-bold text-white">Retry</button></div> : filtered.length ? <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => { const stock = stockStatus(product); const available = product.availableStock ?? Math.max(0, (product.currentStock || 0) - (product.reservedStock || 0)); return <article key={product._id} className="group overflow-hidden border border-slate-200 bg-white"><div className="aspect-[4/3] overflow-hidden bg-slate-100">{product.image && <img src={product.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}</div><div className="p-5"><div className="flex items-center justify-between"><span className="eyebrow">{product.category}</span><span className="text-xs font-bold text-slate-400">{product.sku}</span></div><div className="mt-3 flex items-center justify-between gap-2"><h2 className="font-display text-xl font-bold text-ink">{product.name}</h2><span className={`inline-flex shrink-0 items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase ${stock.className}`}><Boxes size={12} />{stock.label}</span></div><div className="mt-3 flex items-center justify-between gap-2"><p className="text-sm font-bold text-slate-600">{product.supplierId?.name || 'Supplier pending'}</p><SupplierBadge supplier={product.supplierId} compact /></div><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{product.description}</p><p className="mt-3 text-xs font-bold text-slate-500">{available} units available now{product.leadTimeDays ? ` · ${product.leadTimeDays}d lead time` : ''}</p><button onClick={() => setSelected(product)} className="mt-5 flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 text-sm font-bold text-white">Open negotiation <ArrowUpRight size={16} /></button></div></article>; })}</div> : <div className="mt-10 border border-dashed border-slate-300 p-10 text-center text-slate-500">No products match your search.</div>}
    {selected && <NegotiationSlideOver product={selected} onClose={() => setSelected(null)} onSubmitted={() => {}} />}
  </div>;
}