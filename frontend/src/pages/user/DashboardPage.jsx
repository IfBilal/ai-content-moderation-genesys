import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Image as ImageIcon, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate, outcomeColor } from '../../lib/utils';

const OutcomeIcon = ({ outcome }) => {
  if (outcome === 'Approved') return <CheckCircle size={16} className="text-green-400" />;
  if (outcome === 'Blocked') return <XCircle size={16} className="text-red-400" />;
  return <AlertTriangle size={16} className="text-yellow-400" />;
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
      <Card className="mb-6">
        <CardBody>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !loading && document.getElementById('file-input').click()}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/2'
            }`}
          >
            <input id="file-input" type="file" multiple accept="image/*" className="hidden"
              onChange={(e) => addFiles(e.target.files)} />
            <UploadCloud size={32} className={`mx-auto mb-3 ${dragging ? 'text-blue-400' : 'text-zinc-600'}`} />
            <p className="text-sm font-medium text-white">Drop images here or click to upload</p>
            <p className="text-xs text-zinc-600 mt-1">JPEG, PNG, WEBP, GIF · Max 10MB each · Up to 10 images</p>
          </div>

          {/* File list */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                    <ImageIcon size={14} className="text-zinc-500 flex-shrink-0" />
                    <span className="text-xs text-zinc-300 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-zinc-600">{(file.size / 1024).toFixed(0)}KB</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="text-zinc-600 hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                  </motion.div>
                ))}
                <Button onClick={handleSubmit} loading={loading} className="w-full mt-3" size="lg">
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Analysis Result</h3>
                  <OutcomeBadge outcome={result.submission.overallOutcome} />
                </div>
                <div className="space-y-3">
                  {result.verdicts.map((v, i) => (
                    <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-zinc-400 font-medium">Image {i + 1}</span>
                        <OutcomeBadge outcome={v.outcome} />
                      </div>
                      <div className="space-y-2">
                        {v.categoryBreakdown.filter(c => c.detected).map((c, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <OutcomeIcon outcome={v.outcome} />
                            <span className="text-xs text-zinc-300 flex-1">{c.category}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${c.triggered ? 'bg-red-500' : 'bg-blue-500'}`}
                                  style={{ width: `${c.confidence}%` }} />
                              </div>
                              <span className="text-xs text-zinc-500 w-8">{c.confidence}%</span>
                            </div>
                          </div>
                        ))}
                        {!v.categoryBreakdown.some(c => c.detected) && (
                          <p className="text-xs text-zinc-600 italic">No violations detected</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="mt-4"
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
        <h2 className="text-sm font-semibold text-white mb-3 tracking-tight">Recent Submissions</h2>
        {recentLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : recent?.length === 0 ? (
          <Card><CardBody><p className="text-sm text-zinc-600 text-center py-4">No submissions yet. Upload your first image above.</p></CardBody></Card>
        ) : (
          <Card>
            <div className="divide-y divide-white/5">
              {recent?.map((s, i) => (
                <motion.div key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors cursor-pointer"
                  onClick={() => navigate(`/submissions/${s._id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400">{formatDate(s.createdAt)}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{s.images?.length || 0} image{s.images?.length !== 1 ? 's' : ''}</p>
                  </div>
                  {s.triggeredCategories?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {s.triggeredCategories.slice(0, 2).map(c => (
                        <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/8">{c}</span>
                      ))}
                    </div>
                  )}
                  <OutcomeBadge outcome={s.overallOutcome} />
                  <ArrowRight size={13} className="text-zinc-700" />
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
