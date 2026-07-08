import { useState, useEffect } from 'react';
import { curriculum } from '../data/curriculum';
import { loadDailyStats, loadTestRecords, loadProgress } from '../lib/storage';
import { getStorageInfo, clearStorageKey, clearAllAppData, exportAllData, formatBytes } from '../lib/storage';

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
  const [storageInfo, setStorageInfo] = useState<{ key: string; label: string; size: number; items: number }[]>([]);
  const [showStoragePanel, setShowStoragePanel] = useState(false);

  useEffect(() => {
    setDailyStats(loadDailyStats());
    setTestRecords(loadTestRecords());

    let totalSigns = 0;
    let masteredSigns = 0;
    const progress = loadProgress();
    curriculum.forEach(level => {
      const lp = progress[level.id] || { completed: [], mastered: [] };
      totalSigns += level.signs.length;
      masteredSigns += lp.mastered.length;
    });

    setOverallProgress(totalSigns > 0 ? Math.round((masteredSigns / totalSigns) * 100) : 0);
    refreshStorageInfo();
  }, []);

  const refreshStorageInfo = () => {
    setStorageInfo(getStorageInfo());
  };

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

  const handleClearKey = (key: string) => {
    if (confirm(`Delete "${key}"? This cannot be undone.`)) {
      clearStorageKey(key);
      refreshStorageInfo();
    }
  };

  const handleClearAll = () => {
    if (confirm('Delete ALL local data? This will erase all progress, stats, and training data. This cannot be undone.')) {
      clearAllAppData();
      refreshStorageInfo();
      setDailyStats([]);
      setTestRecords([]);
      setOverallProgress(0);
    }
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signchat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-800/30 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Your Progress</h2>
          <button
            onClick={() => setShowStoragePanel(!showStoragePanel)}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            {showStoragePanel ? 'Hide Storage' : '⚙ Storage'}
          </button>
        </div>
        
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

      {/* Storage Management Panel */}
      {showStoragePanel && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Local Storage Management</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors text-sm"
              >
                Export All
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            All data is stored locally in your browser. No data is sent to any server.
            Use Export to back up your progress, or Clear to reset.
          </p>

          {storageInfo.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No local data found. Start practicing to build your profile!
            </div>
          ) : (
            <div className="space-y-2">
              {storageInfo.map(info => (
                <div
                  key={info.key}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{info.label}</div>
                    <div className="text-xs text-gray-500 font-mono">{info.key}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-300">{formatBytes(info.size)}</div>
                      <div className="text-xs text-gray-500">{info.items} items</div>
                    </div>
                    <button
                      onClick={() => handleClearKey(info.key)}
                      className="px-3 py-1 bg-red-900/30 border border-red-800 rounded text-red-400 text-xs hover:bg-red-900/50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      {testRecords.length === 0 && dailyStats.length === 0 && !showStoragePanel && (
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
