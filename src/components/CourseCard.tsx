import type { Level } from '../data/curriculum';

interface CourseCardProps {
  level: Level;
  progress: number;
  onSelect: () => void;
}

export default function CourseCard({ level, progress, onSelect }: CourseCardProps) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-cyan-600 transition-colors"
    >
      <h3 className="text-xl font-bold mb-2">{level.name}</h3>
      <p className="text-sm text-gray-400 mb-4">{level.description}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        {level.signs.length} signs
      </div>
    </button>
  );
}
