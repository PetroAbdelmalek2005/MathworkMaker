import { useState } from 'react';
import { GRADE_TOPICS, DIFFICULTIES } from '../utils/topics';

export default function ConfigPanel({ onGenerate, loading, retryCountdown = 0 }) {
  const [grade, setGrade] = useState(5);
  const [topic, setTopic] = useState(GRADE_TOPICS[5][0]);
  const [difficulty, setDifficulty] = useState('Medium');

  function handleGradeChange(newGrade) {
    setGrade(newGrade);
    setTopic(GRADE_TOPICS[newGrade][0]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate({ grade, topic, difficulty });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-5">Configure Worksheet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Grade</label>
            <select
              value={grade}
              onChange={(e) => handleGradeChange(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GRADE_TOPICS[grade].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || retryCountdown > 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Generating…' : retryCountdown > 0 ? `Retry in ${retryCountdown}s…` : 'Generate Worksheet'}
        </button>
      </form>
    </div>
  );
}
