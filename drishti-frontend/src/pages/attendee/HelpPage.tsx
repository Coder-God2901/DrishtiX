import { FindAndHelpSystem } from '../../components/attendee/FindAndHelpSystem';
import { MedicalAssistanceSystem } from '../../components/attendee/MedicalAssistanceSystem';
import { FAQChatbot } from '../../components/shared/FAQChatbot';
import { useState } from 'react';
import { HelpCircle, Heart, MessageCircle } from 'lucide-react';

/**
 * Attendee Help Page
 * Help, support, and assistance services
 */
export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<'find' | 'medical' | 'faq'>('find');

  const tabs = [
    { id: 'find' as const, name: 'Find & Help', icon: HelpCircle },
    { id: 'medical' as const, name: 'Medical', icon: Heart },
    { id: 'faq' as const, name: 'FAQ', icon: MessageCircle },
  ];

  return (
    <div className="h-full bg-slate-950">
      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="flex gap-2 p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-73px)]">
        {activeTab === 'find' && <FindAndHelpSystem onBack={() => navigate('/attendee/dashboard')} />}
        {activeTab === 'medical' && <MedicalAssistanceSystem onBack={() => navigate('/attendee/dashboard')} />}
        {activeTab === 'faq' && <FAQChatbot isOpen={true} onClose={() => navigate('/attendee/dashboard')} />}
      </div>
    </div>
  );
}
