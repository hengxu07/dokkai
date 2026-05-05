import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://127.0.0.1:8000';

function Dashboard() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const [docId, setDocId] = useState('');
    const [file, setFile] = useState(null);
    const [activeTab, setActiveTab] = useState('vocabulary');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploaded, setUploaded] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleUpload = async () => {
        if (!docId || !file) return setError('Please enter a document ID and select a file');
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            await axios.post(`${API}/upload/${docId}`, formData, { headers });
            setUploaded(true);
            setResult(null);
        } catch (err) {
            setError('Upload failed');
        }
        setLoading(false);
    };

    const handleAnalyze = async () => {
        if (!docId) return setError('Please enter a document ID');
        setLoading(true);
        setError('');
        setResult(null);
        try {
            let res;
            if (activeTab === 'vocabulary') res = await axios.get(`${API}/vocabulary/${docId}`, { headers });
            else if (activeTab === 'grammar') res = await axios.get(`${API}/grammar/${docId}`, { headers });
            else if (activeTab === 'level') res = await axios.get(`${API}/level/${docId}`, { headers });
            else if (activeTab === 'kanji') res = await axios.get(`${API}/kanji/${docId}`, { headers });
            else if (activeTab === 'quiz') res = await axios.post(`${API}/quiz/${docId}`, {}, { headers });
            setResult(res.data);
        } catch (err) {
            setError('Analysis failed. Make sure the document is uploaded.');
        }
        setLoading(false);
    };

    const renderResult = () => {
        if (!result) return null;
        if (activeTab === 'vocabulary') {
            return (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Word</th>
                            <th style={styles.th}>Reading</th>
                            <th style={styles.th}>Meaning</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.vocabulary.map((v, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{v.word}</td>
                                <td style={styles.td}>{v.reading}</td>
                                <td style={styles.td}>{v.meaning}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        if (activeTab === 'grammar') {
            return result.grammar.map((g, i) => (
                <div key={i} style={styles.card}>
                    <p style={styles.pattern}>{g.pattern}</p>
                    <p style={styles.explanation}>{g.explanation}</p>
                    <p style={styles.example}>例: {g.example}</p>
                </div>
            ));
        }
        if (activeTab === 'level') {
            return (
                <div style={styles.card}>
                    <p style={styles.level}>JLPT {result.level}</p>
                    <p style={styles.explanation}>{result.reason}</p>
                </div>
            );
        }
        if (activeTab === 'kanji') {
            return (
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Kanji</th>
                            <th style={styles.th}>Reading</th>
                            <th style={styles.th}>Meaning</th>
                            <th style={styles.th}>Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.kanji.map((k, i) => (
                            <tr key={i}>
                                <td style={{ ...styles.td, fontSize: '24px', fontWeight: 'bold' }}>{k.kanji}</td>
                                <td style={styles.td}>{k.reading}</td>
                                <td style={styles.td}>{k.meaning}</td>
                                <td style={styles.td}>{k.example}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
        if (activeTab === 'quiz') {
            return result.quiz.map((q, i) => (
                <div key={i} style={styles.card}>
                    <p style={styles.question}>{i + 1}. {q.question}</p>
                    {q.choices.map((c, j) => (
                        <p key={j} style={{ ...styles.choice, background: c === q.answer ? '#d4edda' : '#f8f9fa' }}>
                            {c} {c === q.answer ? '✅' : ''}
                        </p>
                    ))}
                </div>
            ));
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>📖 Dokkai </h1>
                <div style={styles.userInfo}>
                    <span style={styles.username}>👤 {username}</span>
                    <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
                </div>
            </div>

            <div style={styles.main}>
                {/* Upload Section */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Upload Document</h2>
                    <div style={styles.uploadRow}>
                        <input
                            style={styles.input}
                            placeholder="Document ID (e.g. lesson1)"
                            value={docId}
                            onChange={e => setDocId(e.target.value)}
                        />
                        <input type="file" accept=".txt,.pdf" onChange={e => setFile(e.target.files[0])} />
                        <button style={styles.button} onClick={handleUpload} disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                    {uploaded && <p style={styles.success}>✅ Document uploaded successfully!</p>}
                </div>

                {/* Analyze Section */}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Analyze</h2>
                    <div style={styles.tabs}>
                        {['vocabulary', 'grammar', 'kanji', 'level', 'quiz'].map(tab => (
                            <button
                                key={tab}
                                style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
                                onClick={() => { setActiveTab(tab); setResult(null); }}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button style={styles.button} onClick={handleAnalyze} disabled={loading}>
                        {loading ? 'Analyzing...' : `Get ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    </button>
                </div>

                {error && <p style={styles.error}>{error}</p>}
                <div style={styles.results}>{renderResult()}</div>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', background: '#f5f5f5' },
    header: { background: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    title: { fontSize: '24px', margin: 0 },
    userInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
    username: { fontSize: '14px', color: '#555' },
    logoutBtn: { padding: '6px 16px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    main: { maxWidth: '800px', margin: '32px auto', padding: '0 16px' },
    section: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    sectionTitle: { fontSize: '18px', marginBottom: '16px', marginTop: 0 },
    uploadRow: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
    button: { padding: '10px 20px', background: '#e63946', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    success: { color: 'green', marginTop: '8px', fontSize: '13px' },
    error: { color: 'red', fontSize: '13px' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
    tab: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: 'white', fontSize: '14px' },
    activeTab: { background: '#e63946', color: 'white', border: '1px solid #e63946' },
    results: { marginTop: '8px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px', borderBottom: '2px solid #eee', fontSize: '13px', color: '#555' },
    td: { padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px' },
    card: { background: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
    pattern: { fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' },
    explanation: { color: '#555', fontSize: '14px', marginBottom: '4px' },
    example: { color: '#888', fontSize: '13px', fontStyle: 'italic' },
    level: { fontSize: '32px', fontWeight: 'bold', color: '#e63946', marginBottom: '8px' },
    question: { fontWeight: 'bold', marginBottom: '8px' },
    choice: { padding: '8px 12px', borderRadius: '6px', marginBottom: '6px', fontSize: '14px' },
};

export default Dashboard;