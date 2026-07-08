import { useState, useCallback, useRef, useEffect } from 'react';
import type { Level } from '../data/curriculum';
import HandTracker from './HandTracker';
import type { GestureResult } from '../lib/gestureRecognizer';
import type { HandAnalysis } from '../lib/gestureRecognizer';

interface DataCollectorProps {
  level: Level;
  onBack: () => void;
}

interface CollectedSample {
  label: string;
  landmarks: number[]; // Flattened 21 landmarks × 3 coords = 63 values
  timestamp: number;
}

export default function DataCollector({ level, onBack }: DataCollectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [samples, setSamples] = useState<CollectedSample[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'ready' | 'recording' | 'success' | 'error'>('ready');
  const [message, setMessage] = useState('点击"开始录制"按钮，然后做出手势');
  
  const currentSign = level.signs[currentIndex];
  const recordingIntervalRef = useRef<number | null>(null);

  // Load existing samples from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`asl-training-data-${level.id}`);
    if (saved) {
      setSamples(JSON.parse(saved));
    }
  }, [level.id]);

  // Save samples to localStorage
  const saveSamples = (newSamples: CollectedSample[]) => {
    setSamples(newSamples);
    localStorage.setItem(`asl-training-data-${level.id}`, JSON.stringify(newSamples));
  };

  const handleGestureDetected = useCallback((_result: GestureResult | null, analysis?: HandAnalysis) => {
    if (analysis) {
      if (isRecording && analysis.landmarks && analysis.landmarks.length === 21) {
        // Flatten landmarks to array
        const flattened = analysis.landmarks.flatMap((lm: any) => [lm.x, lm.y, lm.z]);
        
        const newSample: CollectedSample = {
          label: currentSign.label,
          landmarks: flattened,
          timestamp: Date.now(),
        };
        
        const updatedSamples = [...samples, newSample];
        saveSamples(updatedSamples);
        
        setStatus('success');
        setMessage(`已录制 ${updatedSamples.filter(s => s.label === currentSign.label).length} 个样本`);
        
        // Auto-stop after 10 samples
        const labelCount = updatedSamples.filter(s => s.label === currentSign.label).length;
        if (labelCount >= 10) {
          stopRecording();
          setMessage(`"${currentSign.label}" 已收集 10 个样本，可以下一个了`);
        }
      }
    }
  }, [isRecording, currentSign, samples]);

  const startRecording = () => {
    setIsRecording(true);
    setStatus('recording');
    setMessage('正在录制... 请保持手势稳定');
    
    // Sample every 500ms for 5 seconds (10 samples)
    let count = 0;
    recordingIntervalRef.current = setInterval(() => {
      count++;
      if (count >= 10) {
        stopRecording();
      }
    }, 500);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('ready');
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleNext = () => {
    if (currentIndex < level.signs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStatus('ready');
      setMessage('点击"开始录制"按钮，然后做出手势');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setStatus('ready');
      setMessage('点击"开始录制"按钮，然后做出手势');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(samples, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asl-training-data-${level.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('确定要清除所有训练数据吗？')) {
      saveSamples([]);
      setMessage('数据已清除');
    }
  };

  const getSampleCount = (label: string) => {
    return samples.filter(s => s.label === label).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← 返回
        </button>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
            disabled={samples.length === 0}
          >
            导出数据 ({samples.length})
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
            disabled={samples.length === 0}
          >
            清除数据
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">训练数据收集</h2>
        <p className="text-gray-400 mb-6">
          为每个手势录制 10 个样本，用于训练个性化识别模型。每个手势需要做出准确的手势并保持稳定。
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Camera */}
          <div>
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 mb-4">
              <HandTracker
                onGesture={handleGestureDetected}
                onHandDetected={() => {}}
              />
            </div>

            <div className={`rounded-xl p-4 border ${
              status === 'recording' ? 'bg-red-900/20 border-red-700' :
              status === 'success' ? 'bg-green-900/20 border-green-700' :
              'bg-gray-800 border-gray-700'
            }`}>
              <p className="text-sm text-gray-400 mb-2">状态：</p>
              <p className={`text-lg font-semibold ${
                status === 'recording' ? 'text-red-400' :
                status === 'success' ? 'text-green-400' :
                'text-gray-300'
              }`}>
                {message}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-2">当前手势：</p>
                <div className="text-6xl font-bold text-cyan-400 mb-2">{currentSign.label}</div>
                <p className="text-gray-300">{currentSign.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">已录制样本</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {getSampleCount(currentSign.label)} / 10
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${(getSampleCount(currentSign.label) / 10) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex-1 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-500 transition-colors font-semibold"
                  >
                    🎥 开始录制
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  >
                    ⏹ 停止录制
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  ← 上一个
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === level.signs.length - 1}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                >
                  下一个 →
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-300">收集进度</h3>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {level.signs.map((sign) => {
                  const count = getSampleCount(sign.label);
                  return (
                    <div
                      key={sign.label}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        sign.label === currentSign.label
                          ? 'bg-cyan-900/30 border border-cyan-700'
                          : count >= 10
                          ? 'bg-green-900/20 border border-green-800'
                          : 'bg-gray-700 border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{sign.label}</span>
                        <span className={`text-xs ${count >= 10 ? 'text-green-400' : 'text-gray-400'}`}>
                          {count}/10
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">使用说明</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• 每个手势需要录制 10 个样本</li>
          <li>• 录制时保持手势稳定，面对摄像头</li>
          <li>• 可以在不同光线、角度下录制以提高模型鲁棒性</li>
          <li>• 录制完成后导出数据，用于训练个性化模型</li>
          <li>• 总样本数：{samples.length} / {level.signs.length * 10}</li>
        </ul>
      </div>
    </div>
  );
}
