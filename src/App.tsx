import { useState, useEffect } from 'react';
import CourseCard from './components/CourseCard';
import LessonView from './components/LessonView';
import PracticeView from './components/PracticeView';
import { curriculum } from './data/curriculum';
import type { Level } from './data/curriculum';

type View = 'courses' | 'lesson' | 'practice';

interface Progress {
  [levelId: string]: {
    completed: string[];
    mastered: string[];
  };
}

export default function App() {
  const [view, setView] = useState<View>('courses');
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState<Progress>({});

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('signchat-progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress to localStorage
  const updateProgress = (levelId: string, signLabel: string, type: 'completed' | 'mastered') => {
    setProgress((prev) => {
      const levelProgress = prev[levelId] || { completed: [], mastered: [] };
      const newProgress = { ...prev };

      if (type === 'completed' && !levelProgress.completed.includes(signLabel)) {
        levelProgress.completed.push(signLabel);
      } else if (type === 'mastered' && !levelProgress.mastered.includes(signLabel)) {
        levelProgress.mastered.push(signLabel);
      }

      newProgress[levelId] = levelProgress;
      localStorage.setItem('signchat-progress', JSON.stringify(newProgress));
      return newProgress;
    });
  };

  const getProgressPercent = (level: Level) => {
    const levelProgress = progress[level.id];
    if (!levelProgress) return 0;
    return (levelProgress.mastered.length / level.signs.length) * 100;
  };

  const handleSelectLevel = (level: Level) => {
    setCurrentLevel(level);
    setView('lesson');
  };

  const handleBack = () => {
    setView('courses');
    setCurrentLevel(null);
  };

  const handleStartPractice = () => {
    setView('practice');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {view === 'courses' && 'ASL Learning Platform'}
              {view === 'lesson' && currentLevel?.name}
              {view === 'practice' && `Practice: ${currentLevel?.name}`}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {view === 'courses' && 'Learn American Sign Language step by step'}
              {view === 'lesson' && 'Watch and learn each sign'}
              {view === 'practice' && 'Practice with real-time feedback'}
            </p>
          </div>
          {view !== 'courses' && (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              ← Back to Courses
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {view === 'courses' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((level) => (
              <CourseCard
                key={level.id}
                level={level}
                progress={getProgressPercent(level)}
                onSelect={() => handleSelectLevel(level)}
              />
            ))}
          </div>
        )}

        {view === 'lesson' && currentLevel && (
          <LessonView
            level={currentLevel}
            progress={progress[currentLevel.id] || { completed: [], mastered: [] }}
            onUpdateProgress={updateProgress}
            onStartPractice={handleStartPractice}
          />
        )}

        {view === 'practice' && currentLevel && (
          <PracticeView
            level={currentLevel}
            progress={progress[currentLevel.id] || { completed: [], mastered: [] }}
            onUpdateProgress={updateProgress}
          />
        )}
      </main>
    </div>
  );
}
