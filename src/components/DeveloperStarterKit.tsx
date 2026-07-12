import React, { useState } from 'react';
import { 
  FileCode, Terminal, HelpCircle, Copy, Check, CheckCircle, ArrowUpRight, 
  BookOpen, Code2, Database, ShieldAlert, Github, ExternalLink 
} from 'lucide-react';
import { 
  SQL_SCHEMA_TEMPLATE, NEXT_WEBHOOK_TEMPLATE, 
  PRISMA_SCHEMA_TEMPLATE, README_INSTRUCTIONS 
} from '../templates';

export default function DeveloperStarterKit() {
  const [activeTab, setActiveTab] = useState<'README' | 'SQL' | 'NEXT_ROUTE' | 'PRISMA'>('README');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const getCode = () => {
    switch (activeTab) {
      case 'README':
        return README_INSTRUCTIONS;
      case 'SQL':
        return SQL_SCHEMA_TEMPLATE;
      case 'NEXT_ROUTE':
        return NEXT_WEBHOOK_TEMPLATE;
      case 'PRISMA':
        return PRISMA_SCHEMA_TEMPLATE;
      default:
        return '';
    }
  };

  const handleCopy = () => {
    const text = getCode();
    navigator.clipboard.writeText(text);
    setCopiedLabel(activeTab);
    setTimeout(() => setCopiedLabel(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Welcome info banner */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-emerald-400" /> Export Starter Kit Siap Pakai (Next.js 15 + Supabase)
          </h3>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-2xl">
            Semua logika, penanganan database, otentikasi signature Lynk.id, dan antrean otomatisasi di atas dapat Anda ekspor langsung ke proyek Anda. Pilih tab di bawah dan tempelkan langsung ke workspace Anda.
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-sans font-semibold transition"
        >
          {copiedLabel === activeTab ? (
            <>
              <Check className="w-3.5 h-3.5" /> Terkopi!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Salin Kode Saat Ini
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation panel left */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block px-2 mb-2">
              Berkas Starter Kit
            </span>

            {/* Readme tab */}
            <button
              onClick={() => setActiveTab('README')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition ${
                activeTab === 'README' 
                  ? 'bg-zinc-800 text-white border-l-2 border-blue-500' 
                  : 'text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>1. README & Vercel Setup</span>
            </button>

            {/* SQL Tab */}
            <button
              onClick={() => setActiveTab('SQL')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition ${
                activeTab === 'SQL' 
                  ? 'bg-zinc-800 text-white border-l-2 border-blue-500' 
                  : 'text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>2. Supabase SQL Schema</span>
            </button>

            {/* Next.js Route */}
            <button
              onClick={() => setActiveTab('NEXT_ROUTE')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition ${
                activeTab === 'NEXT_ROUTE' 
                  ? 'bg-zinc-800 text-white border-l-2 border-blue-500' 
                  : 'text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>3. Next.js 15 Webhook Handler</span>
            </button>

            {/* Prisma schema */}
            <button
              onClick={() => setActiveTab('PRISMA')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition ${
                activeTab === 'PRISMA' 
                  ? 'bg-zinc-800 text-white border-l-2 border-blue-500' 
                  : 'text-zinc-400 hover:bg-zinc-950 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>4. Prisma Database Schema</span>
            </button>
          </div>

          {/* Quick instructions block */}
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 space-y-3 font-sans text-xs">
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block">
              Quick Setup Guide
            </span>
            <div className="space-y-2 text-zinc-400 leading-relaxed">
              <p>
                💡 <strong className="text-zinc-300 font-medium">Tips:</strong> Jalankan SQL Schema di Supabase terlebih dahulu agar semua table relasional terbuat secara instan.
              </p>
              <p>
                🔐 Pastikan <code className="text-amber-500 font-mono">LYNK_WEBHOOK_SECRET</code> di Vercel Anda sama persis dengan Webhook Secret Key yang Anda daftarkan di dashboard Lynk.id.
              </p>
            </div>
            
            <div className="pt-2 border-t border-zinc-900 flex items-center gap-1 text-[11px] text-blue-400 hover:underline cursor-pointer">
              <span>Buka Panduan Lynk.id Developer</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Code display screen right */}
        <div className="lg:col-span-9 bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden flex flex-col">
          {/* File Tab Header info */}
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-850 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="text-zinc-400 font-mono ml-2">
                {activeTab === 'README' && 'README.md'}
                {activeTab === 'SQL' && 'supabase_schema.sql'}
                {activeTab === 'NEXT_ROUTE' && 'app/api/webhook/lynk/route.ts'}
                {activeTab === 'PRISMA' && 'prisma/schema.prisma'}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[11px] font-mono transition"
            >
              {copiedLabel === activeTab ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          {/* Actual Code Viewer container */}
          <div className="font-mono text-[11px] text-zinc-300 p-4 max-h-[550px] overflow-y-auto leading-relaxed bg-zinc-950">
            <pre className="whitespace-pre-wrap select-all">{getCode()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
