import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Image as ImageIcon, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge } from '../../components/ui/Badge';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

const OutcomeIcon = ({ outcome }) => {
  if (outcome === 'Approved') return <CheckCircle size={16} style={{ color: '#4ade80' }} />;
  if (outcome === 'Blocked') return <XCircle size={16} style={{ color: '#f87171' }} />;
  return <AlertTriangle size={16} style={{ color: '#fbbf24' }} />;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recent, setRecent] = useState(null);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const { data } = await api.get('/submissions?limit=5');
      setRecent(data.submissions);
    } catch {
      // silent
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useState(() => { loadRecent(); }, []);

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    if (!valid.length) { toast.error('Only image files are allowed'); return; }
    setFiles(prev => [...prev, ...valid].slice(0, 10));
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!files.length) { toast.error('Select at least one image'); return; }
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      const { data } = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setFiles([]);
      loadRecent();
      toast.success('Analysis complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        subtitle="Submit images for AI-powered content moderation"
      />

      {/* Upload zone */}
      <Card style={{ marginBottom: 24 }}>
        <CardBody>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !loading && document.getElementById('file-input').click()}
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
          >
            <input id="file-input" type="file" multiple accept="image/*" style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)} />
            <UploadCloud size={36} style={{ margin: '0 auto 12px', display: 'block', color: dragging ? '#818cf8' : 'rgba(255,255,255,0.25)' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>Drop images here or click to upload</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>JPEG, PNG, WEBP, GIF · Max 10MB each · Up to 10 images</p>
          </div>

          {/* File list */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((file, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="file-item">
                    <ImageIcon size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{(file.size / 1024).toFixed(0)}KB</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2 }}>
                      <X size={13} />
                    </button>
                  </motion.div>
                ))}
                <Button onClick={handleSubmit} loading={loading} style={{ width: '100%', marginTop: 8 }} size="lg">
                  {loading ? 'Analyzing images...' : `Analyze ${files.length} image${files.length > 1 ? 's' : ''}`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <Card>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Analysis Result</h3>
                  <OutcomeBadge outcome={result.submission.overallOutcome} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.verdicts.map((v, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Image {i + 1}</span>
                        <OutcomeBadge outcome={v.outcome} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {v.categoryBreakdown.filter(c => c.detected).map((c, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <OutcomeIcon outcome={v.outcome} />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{c.category}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="confidence-bar-track" style={{ width: 80 }}>
                                <div className="confidence-bar-fill" style={{ width: `${c.confidence}%`, background: c.triggered ? '#ef4444' : '#6366f1' }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 28 }}>{c.confidence}%</span>
                            </div>
                          </div>
                        ))}
                        {!v.categoryBreakdown.some(c => c.detected) && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No violations detected</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" size="sm" style={{ marginTop: 16 }}
                  onClick={() => navigate(`/submissions/${result.submission._id}`)}>
                  View full details <ArrowRight size={13} />
                </Button>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent submissions */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>Recent Submissions</h2>
        {recentLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><div className="spinner spinner-md" /></div>
        ) : recent?.length === 0 ? (
          <Card><CardBody><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0' }}>No submissions yet. Upload your first image above.</p></CardBody></Card>
        ) : (
          <Card>
            <div className="divide-subtle">
              {recent?.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="submission-row"
                  onClick={() => navigate(`/submissions/${s._id}`)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{formatDate(s.createdAt)}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.images?.length || 0} image{s.images?.length !== 1 ? 's' : ''}</p>
                  </div>
                  {s.triggeredCategories?.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.triggeredCategories.slice(0, 2).map(c => (
                        <span key={c} className="category-chip">{c}</span>
                      ))}
                    </div>
                  )}
                  <OutcomeBadge outcome={s.overallOutcome} />
                  <ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
