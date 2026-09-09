import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, PackageSearch, Settings2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login'); };
  return <header className="border-b border-slate-200/80 bg-paper/90 backdrop-blur-md"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
    <Link to="/dashboard" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-ink text-mint"><PackageSearch size={20} /></span><span className="font-display text-xl font-bold tracking-tight">quotient<span className="text-coral">.</span></span></Link>
    <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-500 md:flex"><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>Overview</NavLink><NavLink to="/products" className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>Catalog</NavLink>{user?.role === 'admin' && <><NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>Analytics</NavLink><NavLink to="/admin/suppliers" className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>Suppliers</NavLink><NavLink to="/admin/products" className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>Products</NavLink><NavLink to="/admin/pricing-rules" className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>Pricing rules</NavLink></>}</nav>
    <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold text-ink">{user?.name}</p><p className="text-xs capitalize text-slate-500">{user?.role} account</p></div><button onClick={signOut} className="icon-button" title="Sign out"><LogOut size={18} /></button></div>
  </div></header>;
}