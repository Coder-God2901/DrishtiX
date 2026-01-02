import { ChevronRight } from 'lucide-react';

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  color: 'blue' | 'indigo' | 'purple';
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    button: 'text-blue-600 hover:text-blue-700',
  },
  indigo: {
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    button: 'text-indigo-600 hover:text-indigo-700',
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    button: 'text-purple-600 hover:text-purple-700',
  },
};

export function ModuleCard({ icon, title, description, buttonText, color, onClick }: ModuleCardProps) {
  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center ${colors.iconText}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-600 text-sm">{description}</p>
        </div>
      </div>
      <button 
        onClick={onClick}
        className={`group flex items-center gap-2 ${colors.button} transition-colors`}
      >
        <span>{buttonText}</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
