import React from 'react';
import { Trophy, Award, Star, Medal, Users } from 'lucide-react';

export function AchievementSection() {
  const achievements = [
    { name: 'Reliable', icon: <Award className="w-5 h-5" />, earned: true },
    { name: 'Quality', icon: <Star className="w-5 h-5" />, earned: true },
    { name: 'Speedster', icon: <Medal className="w-5 h-5" />, earned: false },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-slate-900">Achievement Progress</h3>
            <p className="text-slate-600 text-sm mt-1">Complete 3 more to earn Speedster</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recent Achievements */}
        <div>
          <p className="text-slate-700 text-sm mb-4">Recent Achievements</p>
          <div className="flex gap-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`flex-1 aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  achievement.earned
                    ? 'bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600 hover:scale-105'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {achievement.icon}
                <span className="text-xs">{achievement.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Speedster Badge Progress */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-slate-700">Speedster Badge</p>
            <p className="text-slate-900">16/20</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" style={{ width: '80%' }} />
          </div>
          <p className="text-slate-600 text-sm mt-2">80% Complete - Almost there!</p>
        </div>

        {/* Our Team */}
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-slate-700">Our Team</p>
                <p className="text-slate-600 text-sm">Active members</p>
              </div>
            </div>
            <div className="text-2xl text-slate-900">+5</div>
          </div>
        </div>
      </div>
    </div>
  );
}
