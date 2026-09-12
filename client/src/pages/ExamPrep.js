import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, generateDocQuiz } from '../api';
import KangarooMascot from '../components/KangarooMascot';

export default function ExamPrep() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);

  const [playerName] = useState((localStorage.getItem('quizaroo-player-name') || '').trim());
  const [docFile, setDocFile] = useState(null);
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [docStats, setDocStats] = useState(null); // { wordCount, charCount, fileSize }
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [error, setError] = useState('');

  // Exam parameters
  const [difficulty, setDifficulty] = useState('medium');
  const [focus, setFocus] = useState('practical'); // 'comprehensive' | 'practical' | 'theoretical'
  const [quizType, setQuizType] = useState('mcq'); // 'mcq' | 'hangaroo'
  const [numQuestions, setNumQuestions] = useState(5);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dynamic step message during generation
  const generatingMessages = [
    'Parsing & analyzing document sections...',
    'Synthesizing university exam questions with AI...',
    'Formulating distinct, realistic answer choices...',
    'Finalizing exam review package & keys...'
  ];

  React.useEffect(() => {
    let timer;
    if (generating) {
      setGeneratingStep(0);
      timer = setInterval(() => {
        setGeneratingStep((prev) => (prev + 1) % 4);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [generating]);

  if (!playerName) {
    return (
      <div className="panel-shell empty-state">
        <h2>Please enter your player name first.</h2>
        <button className="primary-btn" onClick={() => nav('/')}>Back to Home</button>
      </div>
    );
  }

  const handleFileSelect = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    setDocFile(file);
    setDocName(file.name);

    try {
      // Plain text and lightweight text-based files can be read directly or on server
      const isSimpleText = file.name.match(/\.(txt|md|json|csv|py|js|cpp|c|java|html|xml|sql|css)$/i);
      if (isSimpleText && file.size < 2 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result || '';
          setDocText(content);
          const words = content.split(/\s+/).filter(Boolean).length;
          setDocStats({
            wordCount: words,
            charCount: content.length,
            fileSize: file.size
          });
          setUploading(false);
        };
        reader.onerror = () => {
          uploadToServer(file);
        };
        reader.readAsText(file);
      } else {
        // Office documents (DOCX, DOC, PDF, PPTX, XLSX, ODT, RTF) are parsed on server
        await uploadToServer(file);
      }
    } catch (err) {
      console.error('File reading failed:', err);
      setError('Failed to process document. Please ensure it contains readable text.');
      setUploading(false);
    }
  };

  const uploadToServer = async (file) => {
    try {
      const res = await uploadDocument(file);
      if (res && res.text) {
        setDocText(res.text);
        setDocStats({
          wordCount: res.wordCount,
          charCount: res.charCount,
          fileSize: res.fileSize
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and parse document on server.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateExam = async () => {
    const textToUse = docText.trim();
    if (!textToUse || textToUse.length < 20) {
      setError('Please upload a document or paste study notes before generating the quiz.');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const result = await generateDocQuiz({
        documentText: textToUse,
        documentName: docName || 'University Study Material',
        difficulty,
        focus,
        numQuestions: Number(numQuestions) || 5,
        quizType
      });

      if (quizType === 'hangaroo') {
        nav('/hangaroo', {
          state: {
            topic: docName || 'Document Exam',
            examDocName: docName || 'University Material',
            difficulty,
            playerName,
            initialQuestions: result.questions
          }
        });
      } else {
        nav('/quiz', {
          state: {
            topic: docName || 'University Exam Prep',
            examDocName: docName || 'University Material',
            difficulty,
            playerName,
            initialQuestions: result.questions
          }
        });
      }
    } catch (err) {
      console.error('Exam quiz generation failed:', err);
      setError(err.message || 'Failed to generate quiz. Please try again or shorten text.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="panel-shell exam-prep-shell">
      {/* Header */}
      <div className="section-header compact">
        <div>
          <div className="eyebrow-badge">
            🎓 Exam Preparation Studio
          </div>
          <h1>Upload Syllabus, Lab Manual & Exam Material</h1>
          <p className="subtitle">
            Upload your university AI lab manual, lecture slides, or study notes. Quiz-A-Roo will analyze the material and generate a personalized exam prep quiz!
          </p>
        </div>
      </div>

      {generating ? (
        <div className="exam-prep-loading-card">
          <KangarooMascot state="feeding" size="medium" message={generatingMessages[generatingStep]} />
          <div className="spinner" aria-hidden="true" />
          <h2>Analyzing "{docName || 'Document'}"...</h2>
          <p>Target Difficulty: <b>{difficulty.toUpperCase()}</b> • Focus: <b>{focus.toUpperCase()}</b></p>
          <div className="exam-loading-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span>⚡</span> {generatingMessages[generatingStep]}
          </div>
        </div>
      ) : (
        <div className="exam-prep-grid">
          {/* Left Column: Upload & Text Preview */}
          <div className="exam-left-column">
            {/* Drag & Drop Card */}
            <div
              className={`doc-dropzone-card ${isDragOver ? 'drag-over' : ''} ${docFile ? 'has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.odt,.odp,.ods,.rtf,.txt,.md,.json,.csv,.py,.c,.cpp,.java,.html,.xml,.sql,.css"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />

              <div className="dropzone-icon">
                {uploading ? '⏳' : docFile ? '📄' : '📁'}
              </div>

              <div className="dropzone-text">
                {uploading ? (
                  <h3>Extracting text from document...</h3>
                ) : docFile ? (
                  <>
                    <h3>{docFile.name}</h3>
                    <p>Click or drop another file to replace</p>
                  </>
                ) : (
                  <>
                    <h3>Drag & Drop your document here</h3>
                    <p>Supports <b>PDF</b>, <b>Word (.docx/.doc)</b>, <b>PowerPoint (.pptx)</b>, <b>Excel (.xlsx)</b>, <b>TXT</b>, <b>Markdown</b>, & code</p>
                  </>
                )}
              </div>

              <button
                type="button"
                className="secondary-btn browse-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current && fileInputRef.current.click();
                }}
              >
                Browse Files
              </button>
            </div>

            {/* Document Stats & Quick Preview */}
            {docStats && (
              <div className="doc-stats-bar">
                <div className="stat-pill">
                  <span>Words:</span> <b>{docStats.wordCount.toLocaleString()}</b>
                </div>
                <div className="stat-pill">
                  <span>Characters:</span> <b>{docStats.charCount.toLocaleString()}</b>
                </div>
                <div className="stat-pill">
                  <span>File Size:</span> <b>{(docStats.fileSize / 1024).toFixed(1)} KB</b>
                </div>
              </div>
            )}

            {/* Editable / Viewable Text Area */}
            <div className="doc-text-editor-panel">
              <div className="editor-topline">
                <label htmlFor="doc-content-input">
                  <span className="label-title">Document Content & Study Notes</span>
                  <span className="label-desc">You can edit, paste notes, or add specific exam questions:</span>
                </label>
                {docText && (
                  <button
                    type="button"
                    className="clear-text-btn"
                    onClick={() => { setDocText(''); setDocFile(null); setDocStats(null); }}
                  >
                    Clear Text
                  </button>
                )}
              </div>

              <textarea
                id="doc-content-input"
                className="doc-textarea"
                rows={3}
                value={docText}
                onChange={(e) => {
                  const val = e.target.value;
                  setDocText(val);
                  setDocStats({
                    wordCount: val.split(/\s+/).filter(Boolean).length,
                    charCount: val.length,
                    fileSize: val.length
                  });
                }}
                placeholder="Paste your syllabus, AI lab procedures, textbook chapter notes, or upload document above..."
              />
            </div>
          </div>

          {/* Right Column: Exam Quiz Configuration */}
          <div className="exam-right-column">
            <div className="exam-config-card">
              <h3 className="config-heading">⚙️ Exam Quiz Settings</h3>

              {/* 1. Exam Focus Area */}
              <div className="config-section">
                <label className="config-label">Exam Subject Focus</label>
                <div className="focus-options-grid">
                  <button
                    type="button"
                    className={`focus-card ${focus === 'practical' ? 'active' : ''}`}
                    onClick={() => setFocus('practical')}
                  >
                    <span className="focus-icon">🔬</span>
                    <div className="focus-details">
                      <strong>Lab & Practical</strong>
                      <p>Procedures & code</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`focus-card ${focus === 'comprehensive' ? 'active' : ''}`}
                    onClick={() => setFocus('comprehensive')}
                  >
                    <span className="focus-icon">🎓</span>
                    <div className="focus-details">
                      <strong>Full Exam</strong>
                      <p>Theory & practice</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`focus-card ${focus === 'theoretical' ? 'active' : ''}`}
                    onClick={() => setFocus('theoretical')}
                  >
                    <span className="focus-icon">📚</span>
                    <div className="focus-details">
                      <strong>Theory</strong>
                      <p>Core definitions</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Difficulty Level */}
              <div className="config-section">
                <label className="config-label">Exam Difficulty Level</label>
                <div className="diff-pill-selector">
                  {[
                    { id: 'easy', label: 'Easy (100 XP)', color: '#10b981' },
                    { id: 'medium', label: 'Medium (150 XP)', color: '#f59e0b' },
                    { id: 'hard', label: 'Hard (200 XP)', color: '#ef4444' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`diff-pill-btn ${difficulty === item.id ? 'active' : ''} ${item.id}`}
                      onClick={() => setDifficulty(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Quiz Format */}
              <div className="config-section">
                <label className="config-label">Quiz Game Format</label>
                <div className="format-toggle-row">
                  <button
                    type="button"
                    className={`format-chip-btn ${quizType === 'mcq' ? 'active' : ''}`}
                    onClick={() => setQuizType('mcq')}
                  >
                    🎯 Standard MCQ
                  </button>
                  <button
                    type="button"
                    className={`format-chip-btn ${quizType === 'hangaroo' ? 'active' : ''}`}
                    onClick={() => setQuizType('hangaroo')}
                  >
                    🦘 Hangaroo Blanks
                  </button>
                </div>
              </div>

              {/* 4. Question Count */}
              <div className="config-section">
                <div className="count-selection-row">
                  <label className="config-label" htmlFor="q-count-select">Number of Exam Questions:</label>
                  <select
                    id="q-count-select"
                    className="count-select"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                  >
                    <option value={5}>5 Questions (Quick Review)</option>
                    <option value={8}>8 Questions (Standard Test)</option>
                    <option value={10}>10 Questions (Mastery Exam)</option>
                  </select>
                </div>
              </div>

              {error && <div className="auth-error-banner" style={{ marginTop: '12px' }}>⚠️ {error}</div>}

              {/* Launch Button */}
              <button
                type="button"
                className="primary-btn pulse-glow-btn launch-exam-btn"
                onClick={handleGenerateExam}
                disabled={uploading || generating || !docText.trim()}
              >
                🚀 Generate Exam Prep Quiz ({difficulty.toUpperCase()})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
