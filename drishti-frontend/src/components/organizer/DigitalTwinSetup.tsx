import { useState } from 'react';
import {
  ArrowLeft,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Shield,
  Heart,
  Activity,
  MapPin,
  Calendar,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
  Car,
  Truck,
  BarChart3,
  Lightbulb,
  Brain
} from 'lucide-react';

interface DigitalTwinSetupProps {
  onBack: () => void;
}

export function DigitalTwinSetup({ onBack }: DigitalTwinSetupProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timelineView, setTimelineView] = useState<'24h' | '3day' | '7day'>('3day');

  // Weather Predictions
  const weatherForecast = {
    current: {
      temp: 72,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      rainProbability: 20,
      icon: <Cloud className="w-8 h-8" />
    },
    predictions: [
      { day: 'Day 1 (Setup)', temp: 68, condition: 'Sunny', rain: 10, impact: 'low', recommendation: 'Ideal setup conditions' },
      { day: 'Day 2 (Event)', temp: 75, condition: 'Partly Cloudy', rain: 25, impact: 'low', recommendation: 'Monitor afternoon clouds' },
      { day: 'Day 3 (Event)', temp: 73, condition: 'Cloudy', rain: 40, impact: 'medium', recommendation: 'Prepare rain contingency plans' },
    ]
  };

  // Social Sentiment Analysis
  const socialSentiment = {
    overall: 92,
    trend: 'positive',
    sources: {
      twitter: { score: 94, mentions: 15420, sentiment: 'Very Positive' },
      facebook: { score: 91, mentions: 8932, sentiment: 'Positive' },
      instagram: { score: 90, mentions: 22145, sentiment: 'Positive' },
    },
    topTopics: [
      { topic: 'Lineup Announcement', sentiment: 95, volume: 12400 },
      { topic: 'Ticket Sales', sentiment: 88, volume: 8900 },
      { topic: 'Venue Location', sentiment: 91, volume: 6700 },
    ],
    prediction: 'Expected 15% increase in social engagement 48h before event'
  };

  // Crowd Density Predictions
  const crowdPredictions = [
    { 
      zone: 'Main Stage', 
      peakTime: '8:00 PM - 10:00 PM', 
      expectedDensity: 8500, 
      capacity: 10000, 
      risk: 'medium',
      anomalyProbability: 35,
      urgency: 'medium',
      recommendations: ['Deploy 2 additional security teams', 'Open auxiliary entrance gates', 'Activate crowd flow monitors']
    },
    { 
      zone: 'Food Court', 
      peakTime: '12:00 PM - 2:00 PM', 
      expectedDensity: 2800, 
      capacity: 3500, 
      risk: 'low',
      anomalyProbability: 18,
      urgency: 'low',
      recommendations: ['Standard staffing sufficient', 'Monitor queue lengths']
    },
    { 
      zone: 'VIP Area', 
      peakTime: '6:00 PM - 11:00 PM', 
      expectedDensity: 850, 
      capacity: 1000, 
      risk: 'low',
      anomalyProbability: 12,
      urgency: 'low',
      recommendations: ['Maintain premium service standards', 'Dedicated VIP security patrol']
    },
    { 
      zone: 'Backstage', 
      peakTime: '5:00 PM - 7:00 PM', 
      expectedDensity: 180, 
      capacity: 200, 
      risk: 'high',
      anomalyProbability: 62,
      urgency: 'high',
      recommendations: ['Strict access control', 'Increase security personnel', 'Implement badge verification system']
    },
  ];

  // AI Predictions & Recommendations
  const aiPredictions = [
    {
      category: 'Medical',
      icon: <Heart className="w-5 h-5" />,
      color: 'red',
      predictions: [
        { item: 'Expected Medical Incidents', value: '12-15', confidence: 87 },
        { item: 'Heat-related Issues', value: '5-7', confidence: 82 },
        { item: 'Minor Injuries', value: '4-6', confidence: 79 },
      ],
      recommendations: [
        'Deploy 6 medical stations across venue',
        'Stock additional heat-relief supplies',
        'Position 2 ambulances on standby',
        'Brief medical teams on predicted conditions'
      ],
      priority: 'high'
    },
    {
      category: 'Security',
      icon: <Shield className="w-5 h-5" />,
      color: 'purple',
      predictions: [
        { item: 'Crowd Pressure Points', value: '3 zones', confidence: 91 },
        { item: 'Unauthorized Access Attempts', value: '8-12', confidence: 74 },
        { item: 'Lost Item Reports', value: '25-30', confidence: 85 },
      ],
      recommendations: [
        'Increase security at main stage by 30%',
        'Implement dynamic perimeter monitoring',
        'Set up dedicated lost & found station',
        'Deploy mobile security patrols in high-risk zones'
      ],
      priority: 'high'
    },
    {
      category: 'Logistics',
      icon: <Truck className="w-5 h-5" />,
      color: 'blue',
      predictions: [
        { item: 'Equipment Setup Time', value: '8-10 hours', confidence: 88 },
        { item: 'Supply Restocking Needs', value: '4 times', confidence: 83 },
        { item: 'Waste Collection Points', value: '15 units', confidence: 90 },
      ],
      recommendations: [
        'Begin setup 12 hours before event start',
        'Pre-position restocking supplies near high-traffic areas',
        'Deploy waste management teams every 2 hours',
        'Establish clear logistics corridors'
      ],
      priority: 'medium'
    },
    {
      category: 'Weather',
      icon: <CloudRain className="w-5 h-5" />,
      color: 'cyan',
      predictions: [
        { item: 'Rain Probability (Day 3)', value: '40%', confidence: 76 },
        { item: 'Temperature Range', value: '68-75°F', confidence: 92 },
        { item: 'Wind Conditions', value: 'Moderate', confidence: 85 },
      ],
      recommendations: [
        'Prepare rain covers for outdoor equipment',
        'Set up emergency shelter zones',
        'Monitor weather updates every 2 hours',
        'Brief attendees on weather-appropriate clothing'
      ],
      priority: 'medium'
    },
    {
      category: 'Traffic',
      icon: <Car className="w-5 h-5" />,
      color: 'amber',
      predictions: [
        { item: 'Peak Arrival Time', value: '5:00 PM - 7:00 PM', confidence: 89 },
        { item: 'Parking Capacity Stress', value: '85%', confidence: 81 },
        { item: 'Public Transit Usage', value: '35%', confidence: 77 },
      ],
      recommendations: [
        'Open parking lots 3 hours early',
        'Deploy traffic control at 4:00 PM',
        'Coordinate with public transit for extra capacity',
        'Activate dynamic parking signage'
      ],
      priority: 'high'
    },
  ];

  const filteredPredictions = selectedCategory === 'all' 
    ? aiPredictions 
    : aiPredictions.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl mb-1 flex items-center gap-3">
                  <Brain className="w-8 h-8" />
                  Digital Twin - Event Setup Phase
                </h1>
                <p className="text-blue-100">AI-powered predictive insights for Summer Music Festival 2025</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['24h', '3day', '7day'].map((view) => (
                <button
                  key={view}
                  onClick={() => setTimelineView(view as '24h' | '3day' | '7day')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    timelineView === view
                      ? 'bg-white text-blue-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {view === '24h' ? '24 Hours' : view === '3day' ? '3 Days' : '7 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weather Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  {weatherForecast.current.icon}
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Weather Forecast</p>
                  <p className="text-2xl text-slate-900">{weatherForecast.current.temp}°F</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Condition</span>
                  <span className="text-slate-900">{weatherForecast.current.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Rain Probability</span>
                  <span className="text-slate-900">{weatherForecast.current.rainProbability}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Wind Speed</span>
                  <span className="text-slate-900">{weatherForecast.current.windSpeed} mph</span>
                </div>
              </div>
            </div>

            {/* Social Sentiment Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Social Sentiment</p>
                  <p className="text-2xl text-green-600">{socialSentiment.overall}%</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Twitter</span>
                  <span className="text-green-700">{socialSentiment.sources.twitter.score}% ({socialSentiment.sources.twitter.mentions.toLocaleString()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Facebook</span>
                  <span className="text-green-700">{socialSentiment.sources.facebook.score}% ({socialSentiment.sources.facebook.mentions.toLocaleString()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Instagram</span>
                  <span className="text-green-700">{socialSentiment.sources.instagram.score}% ({socialSentiment.sources.instagram.mentions.toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* Expected Attendance Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Expected Attendance</p>
                  <p className="text-2xl text-indigo-600">9,200-9,800</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Confidence</span>
                  <span className="text-indigo-700">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Peak Hour</span>
                  <span className="text-slate-900">8:00 PM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Capacity Utilization</span>
                  <span className="text-slate-900">92-98%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Crowd Density Simulation Map */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 text-xl flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Predicted Crowd Density Simulation
              </h3>
              <p className="text-slate-600 text-sm mt-1">AI-generated crowd flow predictions with anomaly detection</p>
            </div>
            <div className="p-6">
              <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-96 flex items-center justify-center overflow-hidden">
                {/* Map Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">Venue Simulation Map</p>
                  </div>
                </div>

                {/* Simulated Density Overlays */}
                <div className="absolute top-[20%] left-[45%] w-40 h-40 bg-red-500/30 rounded-full blur-3xl" />
                <div className="absolute top-[50%] left-[25%] w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
                <div className="absolute bottom-[25%] right-[30%] w-36 h-36 bg-yellow-500/15 rounded-full blur-2xl" />
                <div className="absolute top-[15%] right-[20%] w-24 h-24 bg-orange-500/25 rounded-full blur-xl" />

                {/* Zone Markers */}
                <div className="absolute top-[22%] left-[47%] bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg border-2 border-white">
                  Main Stage<br/>
                  <span className="text-xs opacity-90">Risk: HIGH</span>
                </div>
                <div className="absolute top-[52%] left-[27%] bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg border-2 border-white">
                  Food Court<br/>
                  <span className="text-xs opacity-90">Risk: MEDIUM</span>
                </div>
                <div className="absolute bottom-[27%] right-[32%] bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg border-2 border-white">
                  VIP Area<br/>
                  <span className="text-xs opacity-90">Risk: LOW</span>
                </div>
                <div className="absolute top-[17%] right-[22%] bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs shadow-lg border-2 border-white">
                  Backstage<br/>
                  <span className="text-xs opacity-90">Risk: HIGH</span>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                  <p className="text-xs text-slate-900 mb-2">Crowd Density</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-xs text-slate-700">High (80-100%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full" />
                      <span className="text-xs text-slate-700">Medium (50-80%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-xs text-slate-700">Low (0-50%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone Predictions */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {crowdPredictions.sort((a, b) => b.anomalyProbability - a.anomalyProbability).map((zone, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl border-2 ${
                      zone.risk === 'high' ? 'bg-red-50 border-red-200' :
                      zone.risk === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-slate-900 mb-1">{zone.zone}</h4>
                        <p className="text-xs text-slate-600">Peak: {zone.peakTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-600 mb-1">Anomaly Risk</p>
                        <p className={`text-lg ${
                          zone.risk === 'high' ? 'text-red-700' :
                          zone.risk === 'medium' ? 'text-amber-700' :
                          'text-green-700'
                        }`}>
                          {zone.anomalyProbability}%
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Density</span>
                        <span>{zone.expectedDensity.toLocaleString()} / {zone.capacity.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            zone.risk === 'high' ? 'bg-red-600' :
                            zone.risk === 'medium' ? 'bg-amber-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${(zone.expectedDensity / zone.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className={`px-3 py-2 rounded-lg text-xs ${
                      zone.urgency === 'high' ? 'bg-red-100 text-red-800' :
                      zone.urgency === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      <span className="uppercase tracking-wide">Urgency: {zone.urgency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex gap-2 flex-wrap">
              {['all', 'Medical', 'Security', 'Logistics', 'Weather', 'Traffic'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* AI Predictions & Recommendations */}
          <div className="space-y-6">
            {filteredPredictions.map((category, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className={`px-6 py-4 border-b border-slate-200 bg-gradient-to-r ${
                  category.color === 'red' ? 'from-red-50 to-pink-50' :
                  category.color === 'purple' ? 'from-purple-50 to-indigo-50' :
                  category.color === 'blue' ? 'from-blue-50 to-cyan-50' :
                  category.color === 'cyan' ? 'from-cyan-50 to-blue-50' :
                  'from-amber-50 to-orange-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${
                        category.color === 'red' ? 'bg-red-100' :
                        category.color === 'purple' ? 'bg-purple-100' :
                        category.color === 'blue' ? 'bg-blue-100' :
                        category.color === 'cyan' ? 'bg-cyan-100' :
                        'bg-amber-100'
                      } rounded-xl flex items-center justify-center ${
                        category.color === 'red' ? 'text-red-600' :
                        category.color === 'purple' ? 'text-purple-600' :
                        category.color === 'blue' ? 'text-blue-600' :
                        category.color === 'cyan' ? 'text-cyan-600' :
                        'text-amber-600'
                      }`}>
                        {category.icon}
                      </div>
                      <h3 className="text-slate-900 text-xl">{category.category} Predictions</h3>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs border ${
                      category.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      Priority: {category.priority.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Predictions */}
                    <div>
                      <h4 className="text-slate-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Predicted Metrics
                      </h4>
                      <div className="space-y-3">
                        {category.predictions.map((pred, pIdx) => (
                          <div key={pIdx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-slate-700">{pred.item}</p>
                              <p className="text-blue-600">{pred.value}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${pred.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-600">{pred.confidence}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendations */}
                    <div>
                      <h4 className="text-slate-900 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-600" />
                        AI Recommendations
                      </h4>
                      <div className="space-y-2">
                        {category.recommendations.map((rec, rIdx) => (
                          <div key={rIdx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weather Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-slate-900 text-xl flex items-center gap-2">
                <Cloud className="w-6 h-6 text-blue-600" />
                Weather Impact Timeline
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weatherForecast.predictions.map((day, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      day.impact === 'high' ? 'bg-red-50 border-red-200' :
                      day.impact === 'medium' ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    }`}
                  >
                    <h4 className="text-slate-900 mb-3">{day.day}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Temperature</span>
                        <span className="text-slate-900">{day.temp}°F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Condition</span>
                        <span className="text-slate-900">{day.condition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Rain</span>
                        <span className="text-slate-900">{day.rain}%</span>
                      </div>
                    </div>
                    <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${
                      day.impact === 'high' ? 'bg-red-100 text-red-800' :
                      day.impact === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {day.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
