import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AdminProducts from './pages/AdminProducts';
import AdminPricingRules from './pages/AdminPricingRules';
import AdminAnalytics from './components/AdminAnalytics';
import AdminSupplierManager from './components/AdminSupplierManager';

function AppLayout() { return <><Navbar /><main><Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/products" element={<Products />} /><Route element={<ProtectedRoute roles={['admin']} />}><Route path="/admin/analytics" element={<AdminAnalytics />} /><Route path="/admin/suppliers" element={<AdminSupplierManager />} /><Route path="/admin/products" element={<AdminProducts />} /><Route path="/admin/pricing-rules" element={<AdminPricingRules />} /></Route></Routes></main></>; }
export default function App() { return <BrowserRouter><AuthProvider><Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route element={<ProtectedRoute />}><Route path="*" element={<AppLayout />} /></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></AuthProvider></BrowserRouter>; }