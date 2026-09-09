import React from 'react';
import { Layers, ArrowRight, Construction } from 'lucide-react';

const PlaceholderModule = ({ title, description }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-8 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Layers size={16} />
            <span>School ERP Module</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100">{title}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-lg">
            {description || `Manage and view ${title.toLowerCase()} records, scheduling, and role-based permissions.`}
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center shrink-0">
          <Construction size={16} className="mr-2" />
          <span>Prepared for Next Chunk</span>
        </div>
      </div>

      {/* Content Preview Box */}
      <div className="glass-card rounded-3xl p-12 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
          <Layers size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-100 mb-2">{title} Architecture Ready</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          The navigation routing, JWT role authorization, and database foreign keys for <span className="text-indigo-300 font-semibold">{title}</span> are fully structured in Chunk 1. Advanced functional views will be implemented in subsequent chunks.
        </p>

        <a
          href="/dashboard"
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-2"
        >
          <span>Return to Active Dashboard</span>
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
};

export default PlaceholderModule;
