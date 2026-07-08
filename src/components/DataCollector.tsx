import { useState, useCallback, useEffect, useRef } from 'react';
import type { Level } from '../data/curriculum';
import HandTracker from './HandTracker';
import SignImage from './SignImage';
import type { GestureResult } from '../lib/gestureRecognizer';
import { addTrainingSample, clearTrainingData, getTrainingStats } from '../lib/knnClassifier';

interface DataCollectorProps {
  level: Level;
  onBack: () => void;
}

export default function DataCollector({ level, onBack }: DataCollectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'ready' | 'recording' | 'success'>('ready');
  const [message, setMessage] = useState('点击「开始录制」按钮，然后做出手势');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [handDetected, setHandDetected] = useState(false);
  const lastSampleTimeRef = useRef(0);

  const currentSign = level.signs[currentIndex];

  // Load stats on mount and after each recording
  useEffect(() => {
    setStats(getTrainingStats());
  }, [level.id, status]);

  const handleGestureDetected = useCallback((_result: GestureResult | null) => {
    // This is called by HandTracker when a stable gesture is detected
    // We don't use the result here - DataCollector records raw landmarks
  }, []);

  // Listen for landmarks data from HandTracker
  useEffect(() => {
    const handleLandmarksData = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.landmarks && isRecording) {
        const landmarks = customEvent.detail.landmarks;
        const now = Date.now();
        
        // Record at most 1 sample per 300ms
        if (now - lastSampleTimeRef.current < 300) return;
        lastSampleTimeRef.current = now;

        addTrainingSample(currentSign.label, landmarks);
        const newStats = getTrainingStats();
        setStats(newStats);
        
        const count = newStats[currentSign.label] || 0;
        setStatus('success');
        setMessage(`已录制 ${count} 个样本`);

        // Auto-advance after 15 samples
        if (count >= 15) {
          stopRecording();
          setMessage(`「${currentSign.label}」已收集 ${count} 个样本`);
        }
      }
    };

    window.addEventListener('landmarks-data', handleLandmarksData as EventListener);
    return () => window.removeEventListener('landmarks-data', handleLandmarksData as EventListener);
  }, [isRecording, currentSign]);

  const startRecording = () => {
    setIsRecording(true);
    setStatus('recording');
    setMessage('正在录制... 请保持手势稳定，可以微调角度');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('ready');
  };

  const handleNext = () => {
    if (currentIndex < level.signs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStatus('ready');
      setMessage('点击「开始录制」按钮，然后做出手势');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setStatus('ready');
      setMessage('点击「开始录制」按钮，然后做出手势');
    }
  };

  const handleClearAll = () => {
    if (confirm('确定要清除所有训练数据吗？这将重置 k-NN 模型。')) {
      clearTrainingData();
      setStats({});
      setMessage('所有训练数据已清除');
    }
  };

  const getSampleCount = (label: string) => stats[label] || 0;

  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0);
  const hasData = totalSamples > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          ← 返回
        </button>
        <div className="flex items-center gap-3">
          {hasData && (
            <span className="text-sm text-green-400">
              ✓ k-NN 模型已激活 ({totalSamples} 个样本)
            </span>
          )}
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors text-sm"
            disabled={!hasData}
          >
            清除训练数据
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">训练数据收集</h2>
        <p className="text-gray-400 mb-6">
          为每个手势录制 15 个样本。k-NN 分类器会根据这些样本识别你的手势。
          录制时请面对摄像头，做出准确的手势，可以稍微变换角度和距离以提高鲁棒性。
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Camera */}
          <div>
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-800 mb-4">
              <HandTracker
                onGesture={handleGestureDetected}
                onHandDetected={setHandDetected}
                levelId={level.id}
              />
            </div>

            <div className={`rounded-xl p-4 border ${
              status === 'recording' ? 'bg-red-900/20 border-red-700' :
              status === 'success' ? 'bg-green-900/20 border-green-700' :
              'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${handDetected ? 'bg-green-500' : 'bg-gray-600'}`} />
                <span className="text-sm text-gray-400">
                  {handDetected ? '手已检测到' : '请将手放入摄像头'}
                </span>
              </div>
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
                <div className="flex justify-center mb-4">
                  <SignImage label={currentSign.label} imageUrl={currentSign.imageUrl} size="md" />
                </div>
                <div className="text-5xl font-bold text-cyan-400 mb-2">{currentSign.label}</div>
                <p className="text-gray-300">{currentSign.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">已录制样本</span>
                  <span className="text-sm font-semibold text-cyan-400">
                    {getSampleCount(currentSign.label)} / 15
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${Math.min((getSampleCount(currentSign.label) / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex-1 px-6 py-3 bg-red-600 rounded-lg hover:bg-red-500 transition-colors font-semibold"
                    disabled={!handDetected}
                  >
                    {handDetected ? '🎥 开始录制' : '请先展示手掌'}
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
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {level.signs.map((sign) => {
                  const count = getSampleCount(sign.label);
                  return (
                    <div
                      key={sign.label}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        sign.label === currentSign.label
                          ? 'bg-cyan-900/30 border border-cyan-700'
                          : count >= 15
                          ? 'bg-green-900/20 border border-green-800'
                          : count > 0
                          ? 'bg-yellow-900/20 border border-yellow-800'
                          : 'bg-gray-700 border border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{sign.label}</span>
                        <span className={`text-xs ${count >= 15 ? 'text-green-400' : count > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                          {count}/15
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
          <li>• 每个手势录制 15 个样本，k-NN 模型会自动激活</li>
          <li>• 录制时保持手势稳定，面对摄像头</li>
          <li>• 可以在不同光线、角度、距离下录制以提高鲁棒性</li>
          <li>• 录制完成后，练习和测试中的识别准确率会大幅提升</li>
          <li>• k-NN 优先，规则识别兜底，两者结合使用</li>
          <li>• 总样本数：{totalSamples} / {level.signs.length * 15}</li>
        </ul>
      </div>
    </div>
  );
}
