import { TrendingUp } from 'lucide-react';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'emerald';
  trend?: 'up' | 'down';
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  emerald: 'bg-emerald-100 text-emerald-600',
};

export function MetricCard({ icon, title, value, subtitle, color, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 text-sm">
            <TrendingUp className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-600 text-sm mb-1">{title}</p>
        <p className="text-slate-900 text-3xl mb-1">{value}</p>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>
    </div>
  );
}
