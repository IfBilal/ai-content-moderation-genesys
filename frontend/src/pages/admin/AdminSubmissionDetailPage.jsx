import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, MinusCircle, XCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

const ConfidenceBar = ({ value, triggered }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div className="confidence-bar-track">
      <div className="confidence-bar-fill"
        style={{ width: `${value}%`, background: triggered ? '#ef4444' : value > 50 ? '#eab308' : '#22c55e' }} />
    </div>
    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', width: 28 }}>{value}%</span>
  </div>
);

const AdminSubmissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPolicy, setShowPolicy] = useState(false);
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideOutcome, setOverrideOutcome] = useState('Approved');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('Accepted');
  const [reviewResponse, setReviewResponse] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get(`/admin/submissions/${id}`);
      setData(d);
    } catch { toast.error('Failed to load submission'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleOverride = async () => {
    setOverrideLoading(true);
    try {
      await api.patch(`/admin/submissions/${id}/override`, { outcome: overrideOutcome });
      toast.success('Verdict overridden');
      setOverrideModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Override failed');
    } finally { setOverrideLoading(false); }
  };

  const handleAppealReview = async () => {
    setReviewLoading(true);
    try {
      await api.patch(`/admin/appeals/${data.appeal._id}`, { status: reviewStatus, adminResponse: reviewResponse });
      toast.success(`Appeal ${reviewStatus.toLowerCase()}`);
      setReviewModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally { setReviewLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner spinner-lg" /></div>;
  if (!data) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '80px 0' }}>Submission not found.</div>;

  const { submission, verdicts, appeal } = data;
  const policySnapshot = verdicts[0]?.policySnapshot || [];

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => navigate('/admin/submissions')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <PageHeader
          title="Submission Review"
          subtitle={`${submission.user?.name} · ${formatDate(submission.createdAt)}`}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <OutcomeBadge outcome={submission.overallOutcome} />
          <Button size="sm" variant="secondary" onClick={() => setOverrideModal(true)}>Override Verdict</Button>
        </div>
      </div>

      {/* User info */}
      <Card style={{ marginBottom: 24 }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#818cf8' }}>
              {submission.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{submission.user?.name}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{submission.user?.email}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Verdicts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {verdicts.map((v, i) => (
          <Card key={v._id}>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>Image {i + 1}</span>
                <OutcomeBadge outcome={v.outcome} />
              </div>
            </CardHeader>
            <CardBody>
              <table className="mod-table">
                <thead>
                  <tr>
                    {['Category','Detected','Confidence','Triggered','Reasoning'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.categoryBreakdown.map((c, j) => (
                    <tr key={j} style={{ cursor: 'default' }}>
                      <td style={{ color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', fontSize: 12 }}>{c.category}</td>
                      <td>
                        {c.detected ? <CheckCircle size={14} style={{ color: '#f87171' }} /> : <MinusCircle size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />}
                      </td>
                      <td><ConfidenceBar value={c.confidence} triggered={c.triggered} /></td>
                      <td>
                        {c.triggered ? <XCircle size={13} style={{ color: '#f87171' }} /> : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', maxWidth: 280 }}>{c.reasoning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Policy snapshot */}
      {policySnapshot.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <button onClick={() => setShowPolicy(!showPolicy)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span>Policy Config at Submission Time</span>
            {showPolicy ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <AnimatePresence>
            {showPolicy && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <table className="mod-table" style={{ marginTop: 16 }}>
                    <thead><tr>{['Category','Enabled','Threshold','Enforcement'].map(h => (
                      <th key={h}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {policySnapshot.map((p, i) => (
                        <tr key={i} style={{ cursor: 'default' }}>
                          <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{p.category}</td>
                          <td><span style={{ fontSize: 12, color: p.enabled ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{p.enabled ? 'Yes' : 'No'}</span></td>
                          <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{p.confidenceThreshold}%</td>
                          <td style={{ fontSize: 12 }}><span style={{ color: p.enforcementBehavior === 'Auto-Block' ? '#f87171' : '#fbbf24' }}>{p.enforcementBehavior}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Appeal */}
      {appeal && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Appeal</h3>
              <AppealBadge status={appeal.status} />
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Justification from {appeal.user?.name}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px' }}>{appeal.justification}</p>
              </div>
              {appeal.adminResponse && (
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Admin response</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px', fontStyle: 'italic' }}>{appeal.adminResponse}</p>
                </div>
              )}
              {appeal.status === 'Pending' && (
                <Button size="sm" onClick={() => setReviewModal(true)}>Review Appeal</Button>
              )}
              {appeal.reviewedAt && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Reviewed {formatDate(appeal.reviewedAt)}</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Override modal */}
      <Modal open={overrideModal} onClose={() => setOverrideModal(false)} title="Override Verdict">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>This will update the submission and all image verdicts immediately.</p>
          <div>
            <label className="form-label">New Outcome</label>
            <select value={overrideOutcome} onChange={e => setOverrideOutcome(e.target.value)}
              className="form-input">
              <option style={{ background: '#0a0a0a', color: 'white' }}>Approved</option>
              <option style={{ background: '#0a0a0a', color: 'white' }}>Flagged for Review</option>
              <option style={{ background: '#0a0a0a', color: 'white' }}>Blocked</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setOverrideModal(false)}>Cancel</Button>
            <Button size="sm" loading={overrideLoading} onClick={handleOverride}>Confirm Override</Button>
          </div>
        </div>
      </Modal>

      {/* Appeal review modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Review Appeal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Accepted','Rejected'].map(s => (
              <button key={s} onClick={() => setReviewStatus(s)}
                className={`status-btn ${reviewStatus === s ? (s === 'Accepted' ? 'accepted' : 'rejected') : ''}`}>
                {s}
              </button>
            ))}
          </div>
          <Textarea label="Response (optional)" placeholder="Write a response to the user..."
            rows={3} value={reviewResponse} onChange={e => setReviewResponse(e.target.value)} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setReviewModal(false)}>Cancel</Button>
            <Button size="sm" loading={reviewLoading} onClick={handleAppealReview}>Submit Review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSubmissionDetailPage;
