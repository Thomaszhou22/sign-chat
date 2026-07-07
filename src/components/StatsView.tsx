import { useState, useEffect } from 'react';
import { curriculum } from '../data/curriculum';

interface DailyStats {
  date: string;
  practiceMinutes: number;
  signsPracticed: number;
  correctAnswers: number;
}

interface TestRecord {
  levelId: string;
  date: string;
  totalSigns: number;
  correct: number;
  accuracy: number;
  wpm: number;
}

export default function StatsView() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    // Load stats from localStorage
    const savedDaily = localStorage.getItem('daily-stats');
    if (savedDaily) setDailyStats(JSON.parse(savedDaily));

    const savedTests = localStorage.getItem('test-records');
    if (savedTests) setTestRecords(JSON.parse(savedTests));

    // Calculate overall progress
    let totalSigns = 0;
    let masteredSigns = 0;
    
    curriculum.forEach(level => {
      const progress = JSON.parse(localStorage.getItem('signchat-progress') || '{}');
      const levelProgress = progress[level.id] || { completed: [], mastered: [] };
      totalSigns += level.signs.length;
      masteredSigns += levelProgress.mastered.length;
    });

    setOverallProgress(totalSigns > 0 ? Math.round((masteredSigns / totalSigns) * 100) : 0);
  }, []);

  const getTotalPracticeTime = () => {
    const total = dailyStats.reduce((sum, day) => sum + day.practiceMinutes, 0);
    return Math.round(total);
  };

  const getAverageAccuracy = () => {
    if (testRecords.length === 0) return 0;
    const avg = testRecords.reduce((sum, test) => sum + test.accuracy, 0) / testRecords.length;
    return Math.round(avg);
  };

  const getStreakDays = () => {
    if (dailyStats.length === 0) return 0;
    
    const sorted = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const stat of sorted) {
      const expectedDate = currentDate.toISOString().split('T')[0];
      if (stat.date === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-800/30 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-6">Your Progress</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-400">{overallProgress}%</div>
            <div className="text-sm text-gray-400">Overall Mastery</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{getStreakDays()}</div>
            <div className="text-sm text-gray-400">Day Streak</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{getTotalPracticeTime()}m</div>
            <div className="text-sm text-gray-400">Total Practice</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-400">{getAverageAccuracy()}%</div>
            <div className="text-sm text-gray-400">Avg Accuracy</div>
          </div>
        </div>
      </div>

      {testRecords.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Tests</h3>
          <div className="space-y-3">
            {testRecords.slice(0, 10).map((test, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {curriculum.find(l => l.id === test.levelId)?.name || test.levelId}
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(test.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-cyan-400">{test.accuracy}%</div>
                  <div className="text-sm text-gray-400">{test.wpm} WPM</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dailyStats.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Daily Activity</h3>
          <div className="space-y-2">
            {dailyStats.slice(-7).reverse().map((day, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>{day.practiceMinutes}m</span>
                  <span>{day.signsPracticed} signs</span>
                  <span className="text-green-400">{day.correctAnswers} correct</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {testRecords.length === 0 && dailyStats.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Stats Yet</h3>
          <p className="text-gray-400">
            Start practicing and taking tests to see your progress here!
          </p>
        </div>
      )}
    </div>
  );
}
