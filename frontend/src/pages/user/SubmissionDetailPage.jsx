import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
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

const SubmissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPolicy, setShowPolicy] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: d } = await api.get(`/submissions/${id}`);
      setData(d);
    } catch { toast.error('Failed to load submission'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const submitAppeal = async () => {
    if (!appealText.trim()) { toast.error('Please write a justification'); return; }
    setAppealLoading(true);
    try {
      await api.post(`/submissions/${id}/appeal`, { justification: appealText });
      toast.success('Appeal submitted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit appeal');
    } finally { setAppealLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner spinner-lg" /></div>;
  if (!data) return <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', padding: '80px 0' }}>Submission not found.</div>;

  const { submission, verdicts, appeal } = data;
  const policySnapshot = verdicts[0]?.policySnapshot || [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/submissions')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <PageHeader
            title="Submission Detail"
            subtitle={`ID: ${id.slice(-8).toUpperCase()} · ${formatDate(submission.createdAt)}`}
          />
        </div>
        <OutcomeBadge outcome={submission.overallOutcome} />
      </div>

      {/* Per-image verdicts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {verdicts.map((v, i) => (
          <motion.div key={v._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
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
                          {c.detected
                            ? <CheckCircle size={14} style={{ color: '#f87171' }} />
                            : <MinusCircle size={14} style={{ color: 'rgba(255,255,255,0.15)' }} />}
                        </td>
                        <td><ConfidenceBar value={c.confidence} triggered={c.triggered} /></td>
                        <td>
                          {c.triggered
                            ? <XCircle size={13} style={{ color: '#f87171' }} />
                            : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', maxWidth: 280 }}>{c.reasoning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Policy snapshot toggle */}
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
                    <thead>
                      <tr>
                        {['Category','Enabled','Threshold','Enforcement'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {policySnapshot.map((p, i) => (
                        <tr key={i} style={{ cursor: 'default' }}>
                          <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{p.category}</td>
                          <td><span style={{ fontSize: 12, color: p.enabled ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{p.enabled ? 'Yes' : 'No'}</span></td>
                          <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{p.confidenceThreshold}%</td>
                          <td style={{ fontSize: 12 }}>
                            <span style={{ color: p.enforcementBehavior === 'Auto-Block' ? '#f87171' : '#fbbf24' }}>
                              {p.enforcementBehavior}
                            </span>
                          </td>
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

      {/* Appeal section */}
      <Card>
        <CardHeader>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Appeal</h3>
        </CardHeader>
        <CardBody>
          {submission.overallOutcome === 'Approved' ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>This submission was approved. No appeal is necessary.</p>
          ) : appeal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Status</span>
                <AppealBadge status={appeal.status} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Your justification</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px' }}>{appeal.justification}</p>
              </div>
              {appeal.adminResponse && (
                <div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Admin response</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px', fontStyle: 'italic' }}>{appeal.adminResponse}</p>
                </div>
              )}
              {appeal.reviewedAt && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Reviewed {formatDate(appeal.reviewedAt)}{appeal.reviewedBy ? ` by ${appeal.reviewedBy.name}` : ''}</p>
              )}
            </div>
          ) : submission.appealEligible ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>You can appeal this decision. Explain why you believe the verdict is incorrect.</p>
              <Textarea
                label="Justification"
                placeholder="Explain why this content should not be flagged or blocked..."
                rows={4}
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
              />
              <Button onClick={submitAppeal} loading={appealLoading}>Submit Appeal</Button>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>This submission is not eligible for appeal.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default SubmissionDetailPage;
