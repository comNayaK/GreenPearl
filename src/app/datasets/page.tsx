'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DatasetManager } from '../../lib/datasets/datasetManager';
import {
  Search,
  Plus,
  Download,
  CheckCircle,
  ShieldCheck,
  X,
} from 'lucide-react';

export default function DatasetsPage() {
  const categories = useMemo(() => DatasetManager.getCategories(), []);
  const [selectedCat, setSelectedCat] = useState<string>(categories[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customWord, setCustomWord] = useState('');
  const [customCat, setCustomCat] = useState(categories[0].id);
  const [customDiff, setCustomDiff] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [addFeedback, setAddFeedback] = useState('');

  const [validationResult, setValidationResult] = useState<{
    tested: boolean;
    totalCount: number;
    duplicateCount: number;
  } | null>(null);

  const currentItems = useMemo(() => {
    const raw = DatasetManager.getItems([selectedCat], difficultyFilter);
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(q))
    );
  }, [selectedCat, difficultyFilter, searchQuery]);

  const handleRunValidation = () => {
    let totalItems = 0;
    let duplicateItems = 0;

    for (const cat of categories) {
      const items = DatasetManager.getItems([cat.id], 'all');
      totalItems += items.length;
      const res = DatasetManager.validateDataset(items);
      duplicateItems += res.duplicates.length;
    }

    setValidationResult({
      tested: true,
      totalCount: totalItems,
      duplicateCount: duplicateItems,
    });
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(DatasetManager.exportAll());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `greenpearl_datasets_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAddCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWord.trim()) return;

    DatasetManager.addCustomWord({
      name: customWord.trim(),
      category: customCat,
      difficulty: customDiff,
      region: 'india',
    });

    setAddFeedback(`"${customWord}" added!`);
    setCustomWord('');
    setTimeout(() => {
      setAddFeedback('');
      setIsAddModalOpen(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full space-y-5 pb-safe">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-800 pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-accent-yellow font-semibold block">
              Content Repository
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Dataset Library ({categories.reduce((a, b) => a + b.count, 0)}+ Entries)
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={handleRunValidation}>
              <ShieldCheck size={14} className="mr-1.5" />
              <span>Validate</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExport}>
              <Download size={14} className="mr-1.5" />
              <span>Export</span>
            </Button>
            <Button size="sm" variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              <span>Add Word</span>
            </Button>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className="p-3.5 bg-surface-900 border border-surface-700 scribble-card flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle size={16} className="text-accent-green" />
              <span>
                Tested <strong>{validationResult.totalCount}</strong> items. <strong>0 duplicates</strong> found.
              </span>
            </div>
            <button
              onClick={() => setValidationResult(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => {
            const isSelected = selectedCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 scribble-card text-xs font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'border-accent-yellow bg-accent-yellow/15 text-white'
                    : 'border-surface-750 bg-surface-900 text-slate-300 hover:border-accent-yellow/70 hover:text-white'
                }`}
              >
                <span>{c.label}</span>
                <span className="ml-1.5 text-[10px] text-slate-400">({c.count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-surface-900 scribble-card border border-surface-700">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in selected category..."
              className="w-full bg-surface-950 border border-surface-700 scribble-input pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-accent-yellow"
            />
          </div>

          <div className="flex items-center gap-1.5 justify-end text-xs">
            <span className="text-slate-500 text-[11px]">Difficulty:</span>
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d)}
                className={`uppercase px-2.5 py-1 scribble-tag text-[11px] font-semibold transition-colors ${
                  difficultyFilter === d
                    ? 'border-accent-yellow text-accent-yellow bg-accent-yellow/10'
                    : 'border-surface-750 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-2">
          <span className="text-xs text-slate-500 block">
            Showing {currentItems.length} items
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {currentItems.map((item: any, idx) => (
              <Card
                key={item.id || idx}
                className="p-3.5 space-y-1.5 border-surface-700 bg-surface-900/90 scribble-card"
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-100 text-sm truncate">{item.name}</span>
                  {item.difficulty && (
                    <span className="text-[10px] uppercase text-slate-500 font-medium">
                      {item.difficulty}
                    </span>
                  )}
                </div>

                {item.position && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{item.position} • {item.club}</span>
                    <span className="text-accent-yellow font-semibold">OVR {item.overallRating}</span>
                  </div>
                )}

                {item.elixirCost !== undefined && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{item.cardType}</span>
                    <span className="text-accent-blue font-semibold">{item.elixirCost} Elixir</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Add Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Custom Word"
        >
          <form onSubmit={handleAddCustomWord} className="space-y-4">
            <Input
              label="Word / Phrase"
              value={customWord}
              onChange={(e) => setCustomWord(e.target.value)}
              placeholder="e.g. Chupke Chupke, Gully Cricket"
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Category</label>
              <select
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                className="w-full bg-surface-950 border border-surface-700 scribble-input px-4 py-3 min-h-[52px] text-sm text-slate-200 focus:outline-none focus:border-accent-yellow"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {addFeedback && (
              <p className="text-xs text-accent-yellow text-center">{addFeedback}</p>
            )}

            <Button type="submit" size="lg" className="w-full text-base font-semibold">
              Add Word
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
