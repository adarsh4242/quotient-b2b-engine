import { ShieldCheck } from 'lucide-react';

const styles = {
  Gold: 'border-amber-200 bg-amber-50 text-amber-800',
  Silver: 'border-slate-300 bg-slate-100 text-slate-700',
  Unverified: 'border-slate-200 bg-white text-slate-500'
};

export default function SupplierBadge({ supplier, compact = false }) {
  if (!supplier) return null;
  const tier = supplier.verificationTier || 'Unverified';
  const metrics = `Score ${supplier.complianceScore ?? 0}/100 · GSTIN ${supplier.gstinStatus || 'not submitted'} · ${supplier.businessAgeYears || 0} years in business`;
  return <span className="group relative inline-flex"><span className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-bold uppercase ${styles[tier]}`}><ShieldCheck size={compact ? 12 : 14} />{compact ? tier : supplier.verificationBadge || `${tier} Verified`}</span><span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 border border-slate-200 bg-ink p-3 text-left text-xs font-normal leading-5 text-white shadow-lg group-hover:block">{metrics}<br />Verified documents: {(supplier.documents || []).filter((document) => document.status === 'verified').length}</span></span>;
}