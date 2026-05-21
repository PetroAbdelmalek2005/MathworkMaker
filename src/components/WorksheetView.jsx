import { useRef, useState } from 'react';
import { InlineMath } from 'react-katex';
import { generatePDF } from '../lib/pdfGenerator';

function MathText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath key={i} math={math} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function WorksheetPage({ data, date }) {
  const today = date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <div className="bg-white font-serif" style={{ width: '210mm', minHeight: '297mm', padding: '15mm 18mm', boxSizing: 'border-box', fontSize: '11pt', lineHeight: '1.5', color: '#111' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #1e40af', paddingBottom: '8px', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: '700', color: '#1e40af', margin: '0 0 4px 0', fontFamily: 'system-ui, sans-serif' }}>
          Math Worksheet
        </h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: '#374151', fontFamily: 'system-ui, sans-serif' }}>
          <span><strong>Grade {data.grade}</strong> · {data.topic} · <span style={{ textTransform: 'capitalize' }}>{data.difficulty}</span></span>
          <span>Date: {today}</span>
        </div>
      </div>

      {/* Name line */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '14px', fontFamily: 'system-ui, sans-serif', fontSize: '10pt', color: '#374151' }}>
        <span>Name: <span style={{ display: 'inline-block', width: '160px', borderBottom: '1px solid #6b7280' }}>&nbsp;</span></span>
      </div>

      {/* Lesson box */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
        <div style={{ fontWeight: '700', color: '#1d4ed8', fontFamily: 'system-ui, sans-serif', fontSize: '10pt', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Lesson
        </div>
        <p style={{ margin: '0 0 8px 0', fontFamily: 'system-ui, sans-serif', fontSize: '10pt', color: '#1e3a5f' }}>
          {data.lesson.concept}
        </p>
        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '8px 12px' }}>
          <div style={{ fontWeight: '600', fontFamily: 'system-ui, sans-serif', fontSize: '9.5pt', color: '#1d4ed8', marginBottom: '4px' }}>Example:</div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '10pt', color: '#111', marginBottom: '4px' }}>
            <MathText text={data.lesson.example_problem} />
          </div>
          <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '10pt', color: '#166534' }}>
            <strong>Solution:</strong> <MathText text={data.lesson.example_solution} />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div style={{ fontWeight: '700', color: '#111', fontFamily: 'system-ui, sans-serif', fontSize: '11pt', marginBottom: '10px' }}>
        Questions
      </div>
      <div>
        {data.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '8px', fontFamily: 'system-ui, sans-serif', fontSize: '10.5pt', color: '#111' }}>
              <span style={{ fontWeight: '600', minWidth: '20px' }}>{q.id}.</span>
              <span><MathText text={q.question} /></span>
            </div>
            <div style={{ marginLeft: '28px', marginTop: '6px', borderBottom: '1px solid #cbd5e1', paddingBottom: '16px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerKeyPage({ data }) {
  return (
    <div className="bg-white font-serif" style={{ width: '210mm', minHeight: '297mm', padding: '15mm 18mm', boxSizing: 'border-box', fontSize: '11pt', lineHeight: '1.5', color: '#111' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #15803d', paddingBottom: '8px', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: '700', color: '#15803d', margin: '0 0 4px 0', fontFamily: 'system-ui, sans-serif' }}>
          Answer Key
        </h1>
        <div style={{ fontSize: '10pt', color: '#374151', fontFamily: 'system-ui, sans-serif' }}>
          <strong>Grade {data.grade}</strong> · {data.topic} · <span style={{ textTransform: 'capitalize' }}>{data.difficulty}</span>
        </div>
      </div>

      <div>
        {data.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '8px', fontFamily: 'system-ui, sans-serif', fontSize: '10.5pt', color: '#111', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', minWidth: '20px' }}>{q.id}.</span>
              <span><MathText text={q.question} /></span>
            </div>
            <div style={{ marginLeft: '28px', fontFamily: 'system-ui, sans-serif', fontSize: '10pt' }}>
              <span style={{ fontWeight: '700', color: '#15803d' }}>Answer: </span>
              <MathText text={q.answer} />
            </div>
            {q.explanation && (
              <div style={{ marginLeft: '28px', fontFamily: 'system-ui, sans-serif', fontSize: '9.5pt', color: '#4b5563', marginTop: '2px' }}>
                <MathText text={q.explanation} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorksheetView({ data }) {
  const worksheetRef = useRef(null);
  const answerKeyRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const topicSlug = data.topic.replace(/\s+/g, '');
      const filename = `Grade${data.grade}_${topicSlug}_${data.difficulty}_10Q.pdf`;
      await generatePDF(worksheetRef.current, answerKeyRef.current, filename);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Download button */}
      <div className="flex justify-end">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Preview area */}
      <div className="space-y-6">
        {/* Worksheet preview */}
        <div>
          <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Page 1 — Student Worksheet</p>
          <div className="overflow-x-auto rounded-xl shadow border border-slate-200">
            <div ref={worksheetRef}>
              <WorksheetPage data={data} />
            </div>
          </div>
        </div>

        {/* Answer key preview */}
        <div>
          <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Page 2 — Answer Key</p>
          <div className="overflow-x-auto rounded-xl shadow border border-slate-200">
            <div ref={answerKeyRef}>
              <AnswerKeyPage data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
