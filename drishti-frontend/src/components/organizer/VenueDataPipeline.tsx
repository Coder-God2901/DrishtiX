import { useState } from 'react';
import {
  ArrowLeft,
  Database,
  Upload,
  Download,
  MapPin,
  Layers,
  CheckCircle,
  AlertTriangle,
  FileText,
  Map,
  Grid,
  Zap,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

interface VenueDataPipelineProps {
  onBack: () => void;
}

interface DataSource {
  id: string;
  name: string;
  type: 'cad' | 'gis' | 'manual' | 'api';
  status: 'active' | 'inactive' | 'syncing';
  lastSync: string;
  records: number;
}

interface VenueLayer {
  id: string;
  name: string;
  type: 'boundary' | 'zone' | 'gate' | 'facility';
  enabled: boolean;
  color: string;
}

export function VenueDataPipeline({ onBack }: VenueDataPipelineProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'pipeline' | 'preview'>('sources');
  const [isSyncing, setIsSyncing] = useState(false);

  const [dataSources, setDataSources] = useState<DataSource[]>([
    { id: '1', name: 'Google Maps API', type: 'api', status: 'active', lastSync: '2 min ago', records: 1250 },
    { id: '2', name: 'Venue CAD Files', type: 'cad', status: 'active', lastSync: '1 hour ago', records: 450 },
    { id: '3', name: 'GIS Database', type: 'gis', status: 'inactive', lastSync: '2 days ago', records: 800 },
    { id: '4', name: 'Manual Input', type: 'manual', status: 'active', lastSync: '5 min ago', records: 120 }
  ]);

  const [layers, setLayers] = useState<VenueLayer[]>([
    { id: '1', name: 'Venue Boundary', type: 'boundary', enabled: true, color: 'blue' },
    { id: '2', name: 'Event Zones', type: 'zone', enabled: true, color: 'purple' },
    { id: '3', name: 'Entry/Exit Gates', type: 'gate', enabled: true, color: 'green' },
    { id: '4', name: 'Facilities', type: 'facility', enabled: false, color: 'amber' }
  ]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const toggleLayer = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'syncing':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'api':
        return <Zap className="w-5 h-5" />;
      case 'cad':
        return <FileText className="w-5 h-5" />;
      case 'gis':
        return <Grid className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  // Map configuration
  const center: [number, number] = [15.6004, 73.7437]; // Vagator Beach, Goa
  const venueBoundary: [number, number][] = [
    [15.6020, 73.7420],
    [15.6025, 73.7455],
    [15.5990, 73.7460],
    [15.5985, 73.7425]
  ];

  const zones = [
    { id: '1', name: 'Main Stage Area', center: [15.6010, 73.7440] as [number, number], radius: 80 },
    { id: '2', name: 'Food Court', center: [15.6000, 73.7450] as [number, number], radius: 60 },
    { id: '3', name: 'VIP Zone', center: [15.6015, 73.7430] as [number, number], radius: 50 }
  ];

  const gates = [
    { id: '1', name: 'Gate A', position: [15.6020, 73.7437] as [number, number] },
    { id: '2', name: 'Gate B', position: [15.5990, 73.7445] as [number, number] },
    { id: '3', name: 'VIP Entrance', position: [15.6015, 73.7423] as [number, number] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-slate-900 flex items-center gap-2">
                <Database className="w-6 h-6 text-indigo-600" />
                Venue Data Pipeline
              </h1>
              <p className="text-slate-600 text-sm">Import, transform, and manage venue data from multiple sources</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  isSyncing
                    ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync All'}
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'sources'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Data Sources
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'pipeline'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Pipeline Status
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeTab === 'preview'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Map Preview
          </button>
        </div>

        {/* Data Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <Database className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">{dataSources.length}</p>
                <p className="text-slate-600 text-sm">Data Sources</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">{dataSources.filter(s => s.status === 'active').length}</p>
                <p className="text-slate-600 text-sm">Active</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <Layers className="w-8 h-8 text-purple-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">{dataSources.reduce((sum, s) => sum + s.records, 0).toLocaleString()}</p>
                <p className="text-slate-600 text-sm">Total Records</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <RefreshCw className="w-8 h-8 text-indigo-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">Live</p>
                <p className="text-slate-600 text-sm">Sync Status</p>
              </div>
            </div>

            {/* Sources List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dataSources.map(source => (
                <div
                  key={source.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                        {getTypeIcon(source.type)}
                      </div>
                      <div>
                        <h3 className="text-slate-900">{source.name}</h3>
                        <p className="text-slate-600 text-sm capitalize">{source.type}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(source.status)}`}>
                      {source.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Records</span>
                      <span className="text-slate-900">{source.records.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Sync</span>
                      <span className="text-slate-900">{source.lastSync}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all text-sm text-slate-700">
                      Configure
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                      Sync Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Source Button */}
            <button className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600">
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8" />
                <span>Add New Data Source</span>
              </div>
            </button>
          </div>
        )}

        {/* Pipeline Status Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-8">
              <h3 className="text-slate-900 text-xl mb-6">Data Transformation Pipeline</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-900">Data Ingestion</span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-900">Data Transformation</span>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-900">Geo-Processing</span>
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white">
                    <Map className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-900">Map Integration</span>
                      <span className="text-slate-500 text-sm">Pending</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            {/* Layer Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-slate-900 mb-4">Map Layers</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {layers.map(layer => (
                  <label key={layer.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layer.enabled}
                      onChange={() => toggleLayer(layer.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-700">{layer.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mock Map Visualization */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden" style={{ height: '600px' }}>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 p-8">
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Map className="w-5 h-5 text-blue-600" />
                    <span className="text-slate-900">Vagator Beach, Goa</span>
                  </div>
                  <p className="text-slate-600 text-sm">Interactive venue map preview</p>
                </div>

                {/* Venue Boundary */}
                {layers.find(l => l.id === '1')?.enabled && (
                  <div className="absolute inset-0 m-16 border-4 border-blue-500 rounded-3xl bg-blue-100/30 backdrop-blur-sm">
                    <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                      Venue Boundary
                    </div>
                  </div>
                )}

                {/* Event Zones */}
                {layers.find(l => l.id === '2')?.enabled && (
                  <>
                    <div className="absolute top-1/3 left-1/3 w-32 h-32 bg-purple-400/40 rounded-full border-4 border-purple-500 flex items-center justify-center">
                      <span className="text-purple-900 text-sm text-center px-2">Main Stage Area</span>
                    </div>
                    <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-purple-400/40 rounded-full border-4 border-purple-500 flex items-center justify-center">
                      <span className="text-purple-900 text-sm text-center px-2">Food Court</span>
                    </div>
                    <div className="absolute bottom-1/3 left-1/2 w-20 h-20 bg-purple-400/40 rounded-full border-4 border-purple-500 flex items-center justify-center">
                      <span className="text-purple-900 text-xs text-center px-1">VIP Zone</span>
                    </div>
                  </>
                )}

                {/* Gates */}
                {layers.find(l => l.id === '3')?.enabled && (
                  <>
                    <div className="absolute top-1/4 left-20 bg-green-500 rounded-lg shadow-lg p-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-white" />
                      <span className="text-white">Gate A</span>
                    </div>
                    <div className="absolute bottom-1/4 left-20 bg-green-500 rounded-lg shadow-lg p-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-white" />
                      <span className="text-white">Gate B</span>
                    </div>
                    <div className="absolute top-1/3 right-20 bg-green-500 rounded-lg shadow-lg p-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-white" />
                      <span className="text-white text-sm">VIP Entrance</span>
                    </div>
                  </>
                )}

                {/* Facilities */}
                {layers.find(l => l.id === '4')?.enabled && (
                  <>
                    <div className="absolute bottom-1/3 right-1/3 bg-amber-500 rounded-lg shadow-lg p-2 flex items-center gap-2">
                      <span className="text-white text-sm">🚻 Restrooms</span>
                    </div>
                    <div className="absolute top-2/3 left-1/4 bg-amber-500 rounded-lg shadow-lg p-2 flex items-center gap-2">
                      <span className="text-white text-sm">🏥 Medical</span>
                    </div>
                  </>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
                  <h4 className="text-slate-900 mb-3">Legend</h4>
                  <div className="space-y-2 text-sm">
                    {layers.filter(l => l.enabled).map(layer => (
                      <div key={layer.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${
                          layer.color === 'blue' ? 'bg-blue-500' :
                          layer.color === 'purple' ? 'bg-purple-500' :
                          layer.color === 'green' ? 'bg-green-500' :
                          'bg-amber-500'
                        }`} />
                        <span className="text-slate-700">{layer.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Map Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <MapPin className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">12</p>
                <p className="text-slate-600 text-sm">Total Zones Mapped</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <Layers className="w-8 h-8 text-purple-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">8</p>
                <p className="text-slate-600 text-sm">Gates Configured</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <p className="text-2xl text-slate-900 mb-1">100%</p>
                <p className="text-slate-600 text-sm">Mapping Complete</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}