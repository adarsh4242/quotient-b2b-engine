import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';

const blank = { name: '', sku: '', description: '', category: '', image: '', costPrice: '', minMarginPercentage: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const load = () => api.get('/api/products/all').then(({ data }) => setProducts(data));
  useEffect(load, []);
  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, costPrice: form.costPrice === '' ? undefined : Number(form.costPrice), minMarginPercentage: form.minMarginPercentage === '' ? undefined : Number(form.minMarginPercentage) };
    if (editing) await api.put(`/api/products/${editing}`, payload); else await api.post('/api/products', payload);
    setForm(blank); setEditing(null); load();
  };
  const edit = (product) => { setEditing(product._id); setForm({ name: product.name, sku: product.sku, description: product.description, category: product.category, image: product.image, costPrice: product.costPrice ?? '', minMarginPercentage: product.minMarginPercentage ?? '' }); };
  const remove = async (id) => { if (window.confirm('Archive this product?')) { await api.delete(`/api/products/${id}`); load(); } };
  const fields = [['name', 'Name'], ['sku', 'SKU'], ['category', 'Category'], ['image', 'Image URL'], ['costPrice', 'Cost price'], ['minMarginPercentage', 'Minimum margin %']];
  return <div className="page-wrap"><div><p className="eyebrow">Admin console</p><h1 className="mt-2 font-display text-4xl font-bold text-ink">Product inventory</h1></div><div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]"><form onSubmit={submit} className="border border-slate-200 bg-white p-6"><h2 className="font-display text-xl font-bold">{editing ? 'Edit product' : 'Add product'}</h2><div className="mt-5 space-y-4">{fields.map(([key, label]) => <div key={key}><label className="label">{label}</label><input className="input" type={['costPrice', 'minMarginPercentage'].includes(key) ? 'number' : 'text'} min="0" max={key === 'minMarginPercentage' ? '99.99' : undefined} step="0.01" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={['name', 'sku', 'category', 'costPrice', 'minMarginPercentage'].includes(key)} /></div>)}<div><label className="label">Description</label><textarea className="input min-h-24" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required /></div></div><button className="mt-5 flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 text-sm font-bold text-white"><Plus size={16} />{editing ? 'Save changes' : 'Create product'}</button></form><div className="space-y-3">{products.map((product) => <div key={product._id} className="flex items-center justify-between border border-slate-200 bg-white p-4"><div><p className="font-bold text-ink">{product.name}</p><p className="mt-1 text-sm text-slate-500">{product.sku} · {product.category}</p></div><div className="flex gap-2"><button onClick={() => edit(product)} className="icon-button"><Pencil size={16} /></button><button onClick={() => remove(product._id)} className="icon-button text-red-600"><Trash2 size={16} /></button></div></div>)}</div></div></div>;
}