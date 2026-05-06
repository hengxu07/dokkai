import { useState } from 'react';
import axios from 'axios';

const API = 'https://web-production-09a51.up.railway.app';

function Dashboard() {
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('vocabulary');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleUpload = async () => {
    if (!file) return setError('Please select a file');
    const autoDocId = file.name.replace(/\.[^/.]+$/, ''); // remove extension
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API}/upload/${autoDocId}`, formData, { headers });
      if (!documents.includes(autoDocId)) setDocuments([...documents, autoDocId]);
      setSelectedDoc(autoDocId);
      setResult(null);
      setFile(null);
    } catch (err) {
      setError('Upload failed');
    }
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!selectedDoc) return setError('Please upload or select a document first');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let res;
      if (activeTab === 'vocabulary') res = await axios.get(`${API}/vocabulary/${selectedDoc}`, { headers });
      else if (activeTab === 'grammar') res = await axios.get(`${API}/grammar/${selectedDoc}`, { headers });
      else if (activeTab === 'kanji') res = await axios.get(`${API}/kanji/${selectedDoc}`, { headers });
      else if (activeTab === 'level') res = await axios.get(`${API}/level/${selectedDoc}`, { headers });
      else if (activeTab === 'quiz') res = await axios.post(`${API}/quiz/${selectedDoc}`, {}, { headers });
      setResult(res.data);
    } catch (err) {
      setError('Analysis failed. Make sure the document is uploaded.');
    }
    setLoading(false);
  };

  const renderResult = () => {
    if (!result) return null;

    if (activeTab === 'vocabulary') {
      if (!result.vocabulary) return <p style={s.error}>No vocabulary found</p>;
      return (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Word</th>
              <th style={s.th}>Reading</th>
              <th style={s.th}>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {result.vocabulary.map((v, i) => (
              <tr key={i}>
                <td style={s.td}><span style={s.kanji}>{v.word}</span></td>
                <td style={s.td}><span style={s.reading}>{v.reading}</span></td>
                <td style={s.td}><span style={s.meaning}>{v.meaning}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'grammar') {
      if (!result.grammar) return <p style={s.error}>No grammar found</p>;
      return result.grammar.map((g, i) => (
        <div key={i} style={s.card}>
          <p style={s.pattern}>{g.pattern}</p>
          <p style={s.explanation}>{g.explanation}</p>
          <p style={s.example}>例: {g.example}</p>
        </div>
      ));
    }

    if (activeTab === 'kanji') {
      if (!result.kanji) return <p style={s.error}>No kanji found</p>;
      return (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Kanji</th>
              <th style={s.th}>Reading</th>
              <th style={s.th}>Meaning</th>
              <th style={s.th}>Example</th>
            </tr>
          </thead>
          <tbody>
            {result.kanji.map((k, i) => (
              <tr key={i}>
                <td style={s.td}><span style={{ ...s.kanji, fontSize: '28px' }}>{k.kanji}</span></td>
                <td style={s.td}><span style={s.reading}>{k.reading}</span></td>
                <td style={s.td}><span style={s.meaning}>{k.meaning}</span></td>
                <td style={s.td}><span style={s.reading}>{k.example}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'level') {
      if (!result.level) return <p style={s.error}>No level found</p>;
      return (
        <div style={s.card}>
          <div style={s.levelBadge}>JLPT {result.level}</div>
          <p style={s.explanation}>{result.reason}</p>
        </div>
      );
    }

    if (activeTab === 'quiz') {
      if (!result.quiz) return <p style={s.error}>No quiz found</p>;
      return result.quiz.map((q, i) => (
        <div key={i} style={s.card}>
          <p style={s.pattern}>{i + 1}. {q.question}</p>
          {q.choices.map((c, j) => (
            <div key={j} style={{
              ...s.choice,
              background: c === q.answer ? '#EEEDFE' : '#f5f4f9',
              color: c === q.answer ? '#534AB7' : 'inherit',
              borderColor: c === q.answer ? '#AFA9EC' : 'transparent',
            }}>
              {c === q.answer ? '✓ ' : ''}{c}
            </div>
          ))}
        </div>
      ));
    }
  };

  const tabs = ['vocabulary', 'grammar', 'kanji', 'level', 'quiz'];
  const tabIcons = { vocabulary: '📚', grammar: '📝', kanji: '字', level: '📊', quiz: '❓' };

  return (
    <div style={s.app}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoTitle}>読解 Dokkai</div>
          <div style={s.logoSub}>AI Japanese assistant</div>
        </div>

        <div style={s.nav}>
          <div style={s.navLabel}>ANALYZE</div>
          {tabs.map(tab => (
            <div
              key={tab}
              style={{ ...s.navItem, ...(activeTab === tab ? s.navItemActive : {}) }}
              onClick={() => { setActiveTab(tab); setResult(null); }}
            >
              <span style={{ fontSize: '16px' }}>{tabIcons[tab]}</span>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        {documents.length > 0 && (
          <div style={s.docSection}>
            <div style={s.navLabel}>DOCUMENTS</div>
            {documents.map(doc => (
              <div
                key={doc}
                style={{ ...s.docItem, ...(selectedDoc === doc ? s.docItemActive : {}) }}
                onClick={() => { setSelectedDoc(doc); setResult(null); }}
              >
                <div style={{ ...s.docDot, background: selectedDoc === doc ? '#7F77DD' : '#9FE1CB' }} />
                {doc}
              </div>
            ))}
          </div>
        )}

        <div style={s.sidebarBottom}>
          <div style={s.userRow}>
            <div style={s.avatar}>{username?.slice(0, 2).toUpperCase()}</div>
            <span style={s.username}>{username}</span>
            <button style={s.logoutBtn} onClick={handleLogout}>↩</button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div style={s.topbarTitle}>
            {tabIcons[activeTab]} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedDoc && <span style={s.docBadge}>{selectedDoc}</span>}
          </div>
        </div>

        {/* Content */}
        <div style={s.content}>
          {/* Upload */}
          <div
            style={{ ...s.uploadCard, ...(dragOver ? s.uploadCardHover : {}) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
          >
            <div style={s.uploadIcon}>☁️</div>
            <div style={s.uploadTitle}>
              {file ? `Selected: ${file.name}` : 'Upload a Japanese document'}
            </div>
            <div style={s.uploadSub}>Drag & drop or click to choose a .txt or .pdf file</div>
            <div style={s.uploadRow}>
              <label style={s.fileBtn}>
                Choose file
                <input
                  type="file"
                  accept=".txt,.pdf"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files[0])}
                />
              </label>
              <button style={s.uploadBtn} onClick={handleUpload} disabled={loading}>
                {loading ? '...' : 'Upload'}
              </button>
            </div>
          </div>

          {error && <p style={s.error}>{error}</p>}

          {/* Results */}
          {result && <div style={s.results}>{renderResult()}</div>}

          {!result && selectedDoc && !loading && (
  <div style={s.emptyState}>
    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '16px' }}>
      Ready to analyze {selectedDoc}
    </p>
    <button style={s.analyzeBtn} onClick={handleAnalyze}>
      Get {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
    </button>
  </div>
)}

{!selectedDoc && (
  <div style={s.emptyState}>
    <p style={{ color: '#aaa', fontSize: '14px' }}>
      Upload a document to get started
    </p>
  </div>
)}
        </div>
      </div>
    </div>
  );
}

const s = {
  app: { display: 'flex', height: '100vh', background: '#f5f4f9', fontFamily: 'sans-serif' },
  sidebar: { width: '220px', background: '#fff', borderRight: '0.5px solid #e8e7f0', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logo: { padding: '20px', borderBottom: '0.5px solid #e8e7f0' },
  logoTitle: { fontSize: '18px', fontWeight: '500', color: '#1a1a2e' },
  logoSub: { fontSize: '11px', color: '#999', marginTop: '2px' },
  nav: { padding: '12px', flex: 1 },
  navLabel: { fontSize: '10px', color: '#bbb', padding: '8px 8px 4px', letterSpacing: '0.08em' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#666', marginBottom: '2px' },
  navItemActive: { background: '#EEEDFE', color: '#534AB7', fontWeight: '500' },
  docSection: { padding: '12px', borderTop: '0.5px solid #e8e7f0' },
  docItem: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', fontSize: '12px', color: '#666', cursor: 'pointer', marginBottom: '2px' },
  docItemActive: { background: '#f5f4f9', color: '#1a1a2e' },
  docDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  sidebarBottom: { padding: '12px', borderTop: '0.5px solid #e8e7f0' },
  userRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#534AB7', flexShrink: 0 },
  username: { fontSize: '12px', color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: { padding: '4px 8px', border: '0.5px solid #e8e7f0', borderRadius: '6px', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#999' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { background: '#fff', borderBottom: '0.5px solid #e8e7f0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  topbarTitle: { fontSize: '15px', fontWeight: '500', color: '#1a1a2e' },
  docBadge: { fontSize: '12px', padding: '3px 10px', background: '#EEEDFE', color: '#534AB7', borderRadius: '20px' },
  analyzeBtn: { padding: '7px 18px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  content: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  uploadCard: { background: '#fff', border: '1.5px dashed #d0ceee', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '20px' },
  uploadCardHover: { background: '#EEEDFE', borderColor: '#7F77DD' },
  uploadIcon: { fontSize: '28px', marginBottom: '8px' },
  uploadTitle: { fontSize: '14px', fontWeight: '500', color: '#1a1a2e', marginBottom: '4px' },
  uploadSub: { fontSize: '12px', color: '#aaa', marginBottom: '16px' },
  uploadRow: { display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  input: { padding: '8px 12px', borderRadius: '8px', border: '0.5px solid #ddd', fontSize: '13px', width: '180px' },
  fileBtn: { padding: '8px 14px', border: '0.5px solid #ddd', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', background: '#f5f4f9', color: '#555' },
  uploadBtn: { padding: '8px 18px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  error: { color: '#E24B4A', fontSize: '13px', marginBottom: '12px' },
  results: { marginTop: '4px' },
  emptyState: { textAlign: 'center', padding: '40px 0' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid #e8e7f0' },
  th: { textAlign: 'left', padding: '10px 16px', fontSize: '11px', color: '#aaa', borderBottom: '0.5px solid #e8e7f0', fontWeight: '400', background: '#fafafa' },
  td: { padding: '12px 16px', borderBottom: '0.5px solid #f0f0f5' },
  kanji: { fontSize: '22px', fontWeight: '500', color: '#1a1a2e' },
  reading: { fontSize: '13px', color: '#7F77DD' },
  meaning: { fontSize: '13px', color: '#666' },
  card: { background: '#fff', borderRadius: '12px', padding: '16px 20px', marginBottom: '10px', border: '0.5px solid #e8e7f0' },
  pattern: { fontWeight: '500', fontSize: '15px', color: '#1a1a2e', marginBottom: '6px' },
  explanation: { fontSize: '13px', color: '#555', marginBottom: '6px', lineHeight: '1.6' },
  example: { fontSize: '12px', color: '#7F77DD', fontStyle: 'italic' },
  levelBadge: { fontSize: '36px', fontWeight: '500', color: '#534AB7', marginBottom: '12px' },
  choice: { padding: '10px 14px', borderRadius: '8px', marginBottom: '6px', fontSize: '13px', border: '0.5px solid transparent' },
};

export default Dashboard;