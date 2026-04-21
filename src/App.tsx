import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Calendar, 
  Hash,
  X,
  Loader2,
  GraduationCap,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Paper {
  id: number;
  title: string;
  unitCode: string;
  year: number;
  pdfUrl: string;
}

export default function App() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryTopic, setDiscoveryTopic] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    unitCode: '',
    year: new Date().getFullYear(),
    pdfUrl: ''
  });

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/papers');
      const data = await res.json();
      setPapers(data);
    } catch (error) {
      console.error('Failed to fetch papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDiscover = async () => {
    if (!discoveryTopic.trim()) return;
    setIsDiscovering(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for real university revision papers or course PDF materials for the topic: "${discoveryTopic}". 
        Return a list of papers including title, a realistic unit code, year (2020-2024), and a direct PDF URL if found, or a course page URL.
        Use your Google Search tool to find actual institutional links.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                unitCode: { type: Type.STRING },
                year: { type: Type.NUMBER },
                pdfUrl: { type: Type.STRING }
              },
              required: ["title", "unitCode", "year", "pdfUrl"]
            }
          }
        }
      });

      const discoveredPapers = JSON.parse(response.text);
      
      // Auto-add discovered papers to the database
      for (const paper of discoveredPapers) {
        await fetch('/api/papers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paper)
        });
      }
      
      setDiscoveryTopic('');
      fetchPapers();
      alert(`Magic Archive synced! Added ${discoveredPapers.length} papers.`);
    } catch (error) {
      console.error('Discovery failed:', error);
      alert('AI Discovery encountered an issue. Please try a different topic.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', unitCode: '', year: new Date().getFullYear(), pdfUrl: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/papers/${editingId}` : '/api/papers';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        resetForm();
        fetchPapers();
      }
    } catch (error) {
      console.error('Failed to save paper:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    
    try {
      const res = await fetch(`/api/papers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPapers();
        if (editingId === id) resetForm();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const startEdit = (paper: Paper) => {
    setEditingId(paper.id);
    setFormData({
      title: paper.title,
      unitCode: paper.unitCode,
      year: paper.year,
      pdfUrl: paper.pdfUrl
    });
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredPapers = useMemo(() => {
    const query = search.toLowerCase();
    return papers.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.unitCode.toLowerCase().includes(query)
    );
  }, [papers, search]);

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-sans selection:bg-blue-100">
      {/* Sidebar - Matching Design HTML layout */}
      <aside className="w-80 bg-white border-r border-[#e2e8f0] flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 text-[#2563eb] font-bold text-xl">
          <span className="text-2xl">█</span>
          <span>UniPapers</span>
        </div>

        <div className="mb-6">
          <h2 className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold mb-4">Magic Auto-Discover</h2>
          <div className="space-y-3">
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
              <input 
                type="text" 
                placeholder="Topic (e.g. Quantum Physics)"
                value={discoveryTopic}
                onChange={(e) => setDiscoveryTopic(e.target.value)}
                className="w-full bg-[#fefce8] border border-orange-100 rounded-md py-2 pl-9 pr-3 text-[12px] outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-500/5 transition-all text-orange-900 placeholder:text-orange-300"
              />
            </div>
            <button 
              onClick={handleAutoDiscover}
              disabled={isDiscovering || !discoveryTopic}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-md text-[12px] shadow-sm shadow-orange-200 transition-all active:scale-[0.98]"
            >
              {isDiscovering ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {isDiscovering ? 'Searching...' : 'AI Find & Add'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold mb-4">Archives</h2>
          <div className="flex flex-col gap-2">
            <button className="text-left py-2.5 px-3 bg-[#2563eb] text-white rounded-md text-sm font-semibold transition-colors">
              All Materials
            </button>
            <button className="text-left py-2.5 px-3 border border-[#e2e8f0] text-[#475569] rounded-md text-sm font-medium hover:bg-[#f8fafc] transition-colors">
              Featured Guides
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-[11px] uppercase tracking-widest text-[#64748b] font-bold mb-4 mt-4">
            {editingId ? 'Edit Paper Details' : 'Upload New Paper'}
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              required
              type="text"
              placeholder="Paper Title (e.g. Finals)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md p-2.5 text-[13px] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]"
            />
            <input
              required
              type="text"
              placeholder="Unit Code (e.g. PSY101)"
              value={formData.unitCode}
              onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md p-2.5 text-[13px] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]"
            />
            <input
              required
              type="number"
              placeholder="Academic Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md p-2.5 text-[13px] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]"
            />
            <input
              required
              type="url"
              placeholder="External PDF Link"
              value={formData.pdfUrl}
              onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
              className="w-full bg-[#f1f5f9] border border-[#e2e8f0] rounded-md p-2.5 text-[13px] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-[#94a3b8]"
            />
            <div className="flex flex-col gap-2 pt-2">
              <button 
                type="submit"
                className={`w-full ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#2563eb] hover:bg-blue-700'} text-white font-semibold py-3 rounded-md text-[13px] transition-all shadow-sm active:translate-y-px flex items-center justify-center gap-2`}
              >
                {editingId ? <><Edit2 size={14} /> Update Manuscript</> : 'Publish to Library'}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="w-full border border-[#e2e8f0] text-[#64748b] font-medium py-2 rounded-md text-[13px] hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="mt-auto pt-8 border-t border-[#e2e8f0]">
          <div className="text-[11px] text-[#94a3b8] leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>System Status: Online</span>
            </div>
            <div>Revision Library v1.5.0</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 md:p-10 overflow-hidden">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a] leading-tight flex items-center gap-3">
              Revision Library
            </h1>
            <p className="text-[#64748b] mt-1">Manage and access community study resources.</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="text-2xl font-bold text-[#0f172a] tracking-tight">{papers.length}</div>
            <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded">Total Assets</div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#64748b] group-focus-within:text-[#2563eb] transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search papers by unit code, title, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#e2e8f0] rounded-lg py-3.5 pl-12 pr-4 text-sm text-[#1e293b] placeholder:text-[#94a3b8] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
          />
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-[#2563eb]" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredPapers.map((paper) => (
                  <motion.div
                    layout
                    key={paper.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`bg-white border ${editingId === paper.id ? 'border-orange-500 ring-4 ring-orange-500/5 shadow-lg' : 'border-[#e2e8f0]'} rounded-xl p-5 flex flex-col gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#2563eb] hover:shadow-md transition-all group relative`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="relative w-full aspect-[4/3] bg-[#f8fafc] rounded-lg overflow-hidden border border-[#e2e8f0] group-hover:border-[#2563eb]/20 transition-colors">
                          <img 
                            src={`https://picsum.photos/seed/${encodeURIComponent(paper.title)}/400/300?blur=2`}
                            alt="Paper Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                            <div className="w-12 h-12 bg-white/90 backdrop-blur shadow-sm rounded-xl flex items-center justify-center text-[#ef4444] mb-2 transform group-hover:scale-110 transition-transform">
                              <FileText size={24} />
                            </div>
                            <div className="text-[10px] font-bold text-[#64748b] bg-white/80 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              CLICK TO PREVIEW
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#fee2e2] text-[#ef4444] rounded flex items-center justify-center text-[10px] font-extrabold tracking-tighter shadow-sm border border-red-100 flex-shrink-0">
                            PDF
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-[#94a3b8] tracking-widest leading-none mb-1">Archive Entry</span>
                            <div className="flex gap-1.5 overflow-hidden">
                              <span className="bg-[#f1f5f9] text-[#475569] px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 whitespace-nowrap">
                                {paper.unitCode}
                              </span>
                              <span className="bg-[#f1f5f9] text-[#475569] px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                                {paper.year}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button 
                          onClick={() => startEdit(paper)}
                          className="p-1.5 hover:bg-orange-50 text-[#64748b] hover:text-orange-600 rounded-md transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(paper.id)}
                          className="p-1.5 hover:bg-red-50 text-[#64748b] hover:text-red-600 rounded-md transition-colors"
                          title="Remove Paper"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-[16px] font-extrabold ${editingId === paper.id ? 'text-orange-600' : 'text-[#0f172a]'} leading-tight group-hover:text-[#2563eb] transition-colors`}>
                        {paper.title}
                      </h3>
                      <p className="text-[12px] text-[#64748b] mt-1 font-medium italic">Verified Manuscript</p>
                    </div>

                    <div className="mt-auto flex items-center gap-3">
                      <a 
                        href={paper.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 border border-[#dbeafe] text-[#2563eb] text-[12px] font-bold py-2.5 rounded-lg transition-all hover:bg-blue-50 inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        Open Material
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {!loading && filteredPapers.length === 0 && (
                <div className="col-span-full py-20 bg-white border-2 border-dashed border-[#e2e8f0] rounded-3xl flex flex-col items-center justify-center text-[#64748b]">
                  <BookOpen size={48} className="mb-4 opacity-10" />
                  <p className="font-bold text-[#1e293b]">Resource Unavailable</p>
                  <p className="text-sm mt-1">No matching papers found in the selected category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
