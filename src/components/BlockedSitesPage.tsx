import React, { useState } from 'react';
import { Plus, Trash2, Download, Upload, Search, Filter, Clock, Shield, AlertCircle } from 'lucide-react';
import { useZenMode } from '../context/ZenModeContext';

export default function BlockedSitesPage() {
  const { blockedSites, addBlockedSite, removeBlockedSite, exportData, importSites } = useZenMode();
  const [newSiteUrl, setNewSiteUrl] = useState('');
  const [newSiteCategory, setNewSiteCategory] = useState('social');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const categories = [
    { id: 'social', name: 'Social Media', color: 'bg-blue-900 text-blue-100' },
    { id: 'entertainment', name: 'Entertainment', color: 'bg-purple-900 text-purple-100' },
    { id: 'news', name: 'News', color: 'bg-green-900 text-green-100' },
    { id: 'shopping', name: 'Shopping', color: 'bg-yellow-900 text-yellow-100' },
    { id: 'work', name: 'Work Distractions', color: 'bg-red-900 text-red-100' },
    { id: 'other', name: 'Other', color: 'bg-gray-900 text-gray-100' }
  ];

  const handleAddSite = () => {
    if (!newSiteUrl.trim()) {
      return; // Removed alert notification
    }

    // Basic URL validation
    let url = newSiteUrl.trim().toLowerCase();
    if (!url.includes('.')) {
      return; // Removed alert notification
    }

    // Remove protocol if present
    url = url.replace(/^https?:\/\//, '');

    // Check if site already exists
    if (blockedSites.some(site => site.url === url)) {
      return; // Removed alert notification
    }

    addBlockedSite({
      url,
      category: newSiteCategory
    });

    setNewSiteUrl('');
    // Removed success notification
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let sites: any[] = [];

        if (file.name.endsWith('.json')) {
          sites = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(line => line.trim());
          const headers = lines[0].toLowerCase().split(',');
          
          sites = lines.slice(1).map(line => {
            const values = line.split(',');
            const site: any = {};
            headers.forEach((header, index) => {
              site[header.trim()] = values[index]?.trim().replace(/"/g, '');
            });
            return {
              url: site.url || site.domain || site.website,
              category: site.category || 'other'
            };
          }).filter(site => site.url);
        }

        if (sites.length > 0) {
          importSites(sites);
          // Removed success notification
        }
      } catch (error) {
        // Removed error notification
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const filteredAndSortedSites = blockedSites
    .filter(site => {
      const matchesSearch = site.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || site.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.blockedAt - a.blockedAt;
        case 'alphabetical':
          return a.url.localeCompare(b.url);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'timeSaved':
          return b.timeSaved - a.timeSaved;
        case 'blockCount':
          return b.blockCount - a.blockCount;
        default:
          return 0;
      }
    });

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const formatTimeSaved = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const totalTimeSaved = blockedSites.reduce((total, site) => total + site.timeSaved, 0);
  const totalBlocks = blockedSites.reduce((total, site) => total + site.blockCount, 0);

  return (
    <div className="w-full h-full max-w-none px-3 py-2 overflow-hidden">
      {/* Compact Header Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-md p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-lg font-bold">{blockedSites.length}</p>
              <p className="text-xs text-gray-400">Sites</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-md p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-lg font-bold">{formatTimeSaved(totalTimeSaved)}</p>
              <p className="text-xs text-gray-400">Saved</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-md p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-lg font-bold">{totalBlocks}</p>
              <p className="text-xs text-gray-400">Blocks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Add New Site */}
      <div className="bg-gray-900 border border-gray-800 rounded-md p-3 mb-4">
        <div className="space-y-2">
          <input
            type="text"
            value={newSiteUrl}
            onChange={(e) => setNewSiteUrl(e.target.value)}
            placeholder="domain.com or domain.com/page"
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-white"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSite()}
          />
          <div className="flex gap-2">
            <select
              value={newSiteCategory}
              onChange={(e) => setNewSiteCategory(e.target.value)}
              className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-white"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddSite}
              className="px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Compact Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-md p-3 mb-4">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sites..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-white"
            >
              <option value="all">All</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-white"
            >
              <option value="recent">Recent</option>
              <option value="alphabetical">A-Z</option>
              <option value="category">Category</option>
              <option value="timeSaved">Time</option>
              <option value="blockCount">Blocks</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded cursor-pointer transition-colors text-sm">
              <Upload className="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => exportData('sites')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Compact Sites List */}
      <div className="bg-gray-900 border border-gray-800 rounded-md overflow-hidden flex-1">
        {filteredAndSortedSites.length === 0 ? (
          <div className="p-6 text-center">
            <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-400 mb-1">No blocked sites</h3>
            <p className="text-xs text-gray-500">
              {searchTerm || filterCategory !== 'all' 
                ? 'No matches found'
                : 'Add your first site above'
              }
            </p>
          </div>
        ) : (
          <div
            className="divide-y divide-gray-800"
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            {filteredAndSortedSites.map((site) => {
              const categoryInfo = getCategoryInfo(site.category);
              return (
                <div key={site.id} className="p-3 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium truncate max-w-[150px]">{site.url}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{formatTimeSaved(site.timeSaved)}</span>
                        <span>{site.blockCount} blocks</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBlockedSite(site.id)}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
