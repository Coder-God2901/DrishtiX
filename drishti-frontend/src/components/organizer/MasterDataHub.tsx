import { useState } from 'react';
import {
  ArrowLeft,
  Database,
  Users,
  Building,
  Package,
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  CheckCircle
} from 'lucide-react';

interface MasterDataHubProps {
  onBack: () => void;
}

type DataCategory = 'attendees' | 'vendors' | 'staff' | 'resources';

interface DataRecord {
  id: string;
  name: string;
  category: DataCategory;
  status: 'active' | 'inactive';
  lastUpdated: string;
  details: string;
}

export function MasterDataHub({ onBack }: MasterDataHubProps) {
  const [activeCategory, setActiveCategory] = useState<DataCategory>('attendees');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'attendees' as DataCategory, label: 'Attendees', icon: Users, count: 8432, color: 'blue' },
    { id: 'vendors' as DataCategory, label: 'Vendors', icon: Building, count: 45, color: 'purple' },
    { id: 'staff' as DataCategory, label: 'Staff & Volunteers', icon: Shield, count: 230, color: 'green' },
    { id: 'resources' as DataCategory, label: 'Resources', icon: Package, count: 156, color: 'amber' }
  ];

  const [records, setRecords] = useState<DataRecord[]>([
    { id: '1', name: 'Rajesh Kumar', category: 'attendees', status: 'active', lastUpdated: '2 min ago', details: 'VIP Pass • Mumbai' },
    { id: '2', name: 'Priya Singh', category: 'attendees', status: 'active', lastUpdated: '5 min ago', details: 'General Admission • Delhi' },
    { id: '3', name: 'Food Paradise Catering', category: 'vendors', status: 'active', lastUpdated: '1 hour ago', details: 'Food & Beverage • Contract #FP2025' },
    { id: '4', name: 'Stage Tech Solutions', category: 'vendors', status: 'active', lastUpdated: '3 hours ago', details: 'Audio/Visual Equipment • Contract #ST2025' },
    { id: '5', name: 'Amit Patel - Security Lead', category: 'staff', status: 'active', lastUpdated: '10 min ago', details: 'Security Team • Shift: Evening' },
    { id: '6', name: 'Sound System - Main Stage', category: 'resources', status: 'active', lastUpdated: '30 min ago', details: 'Audio Equipment • Location: Main Stage' }
  ]);

  const filteredRecords = records.filter(r => 
    r.category === activeCategory &&
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    switch (cat?.color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'amber': return 'from-amber-500 to-amber-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600" />
                Master Data Hub
              </h1>
              <p className="text-slate-600 text-sm">Centralized repository for all event data</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all text-left ${
                  activeCategory === cat.id ? 'border-blue-500 shadow-lg' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${getCategoryColor(cat.id)} rounded-xl flex items-center justify-center text-white mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-2xl text-slate-900 mb-1">{cat.count.toLocaleString()}</p>
                <p className="text-slate-600 text-sm">{cat.label}</p>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${categories.find(c => c.id === activeCategory)?.label.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-slate-900 text-lg">
              {categories.find(c => c.id === activeCategory)?.label} Database
            </h3>
            <p className="text-slate-600 text-sm">{filteredRecords.length} records found</p>
          </div>
          
          <div className="divide-y divide-slate-200">
            {filteredRecords.map(record => (
              <div key={record.id} className="p-6 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-slate-900">{record.name}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        record.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-1">{record.details}</p>
                    <p className="text-slate-500 text-xs">Last updated: {record.lastUpdated}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="p-12 text-center">
              <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-slate-900 text-lg mb-2">No records found</h3>
              <p className="text-slate-600">Try adjusting your search or add a new record</p>
            </div>
          )}
        </div>

        {/* Data Quality Indicators */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-slate-900 mb-4">Data Quality Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 text-sm">Completeness</span>
                <span className="text-green-700">94%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" style={{ width: '94%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 text-sm">Accuracy</span>
                <span className="text-blue-700">98%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: '98%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 text-sm">Consistency</span>
                <span className="text-purple-700">96%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: '96%' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
