import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

const ConfidenceBar = ({ value, triggered }) => (
  <div className="flex items-center gap-2">
    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${triggered ? 'bg-red-500' : value > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
        style={{ width: `${value}%` }} />
    </div>
    <span className="text-xs text-zinc-500 w-8">{value}%</span>
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-zinc-500 text-sm text-center py-20">Submission not found.</div>;

  const { submission, verdicts, appeal } = data;
  const policySnapshot = verdicts[0]?.policySnapshot || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/submissions')} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <PageHeader
            title="Submission Detail"
            subtitle={`ID: ${id.slice(-8).toUpperCase()} · ${formatDate(submission.createdAt)}`}
          />
        </div>
        <OutcomeBadge outcome={submission.overallOutcome} />
      </div>

      {/* Per-image verdicts */}
      <div className="space-y-4 mb-6">
        {verdicts.map((v, i) => (
          <motion.div key={v._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Image {i + 1}</span>
                  <OutcomeBadge outcome={v.outcome} />
                </div>
              </CardHeader>
              <CardBody>
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Category','Detected','Confidence','Triggered','Reasoning'].map(h => (
                        <th key={h} className="text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-widest pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {v.categoryBreakdown.map((c, j) => (
                      <tr key={j}>
                        <td className="py-2.5 pr-4 text-xs text-zinc-300 whitespace-nowrap">{c.category}</td>
                        <td className="py-2.5 pr-4">
                          {c.detected
                            ? <CheckCircle size={14} className="text-red-400" />
                            : <MinusCircle size={14} className="text-zinc-700" />}
                        </td>
                        <td className="py-2.5 pr-4"><ConfidenceBar value={c.confidence} triggered={c.triggered} /></td>
                        <td className="py-2.5 pr-4">
                          {c.triggered
                            ? <XCircle size={13} className="text-red-400" />
                            : <span className="text-zinc-700 text-xs">—</span>}
                        </td>
                        <td className="py-2.5 text-xs text-zinc-500 italic max-w-xs">{c.reasoning}</td>
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
        <Card className="mb-6">
          <button onClick={() => setShowPolicy(!showPolicy)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            <span>Policy Config at Submission Time</span>
            {showPolicy ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <AnimatePresence>
            {showPolicy && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="px-6 pb-5 border-t border-white/10">
                  <table className="w-full mt-4">
                    <thead>
                      <tr>
                        {['Category','Enabled','Threshold','Enforcement'].map(h => (
                          <th key={h} className="text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-widest pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {policySnapshot.map((p, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 text-xs text-zinc-300">{p.category}</td>
                          <td className="py-2 pr-4">
                            <span className={`text-xs ${p.enabled ? 'text-green-400' : 'text-zinc-600'}`}>{p.enabled ? 'Yes' : 'No'}</span>
                          </td>
                          <td className="py-2 pr-4 text-xs text-zinc-400">{p.confidenceThreshold}%</td>
                          <td className="py-2 text-xs">
                            <span className={p.enforcementBehavior === 'Auto-Block' ? 'text-red-400' : 'text-yellow-400'}>
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
          <h3 className="text-sm font-semibold text-white">Appeal</h3>
        </CardHeader>
        <CardBody>
          {submission.overallOutcome === 'Approved' ? (
            <p className="text-sm text-zinc-600">This submission was approved. No appeal is necessary.</p>
          ) : appeal ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">Status</span>
                <AppealBadge status={appeal.status} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Your justification</p>
                <p className="text-sm text-zinc-300 bg-white/3 border border-white/8 rounded-lg px-3 py-2">{appeal.justification}</p>
              </div>
              {appeal.adminResponse && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Admin response</p>
                  <p className="text-sm text-zinc-300 bg-white/3 border border-white/8 rounded-lg px-3 py-2 italic">{appeal.adminResponse}</p>
                </div>
              )}
              {appeal.reviewedAt && (
                <p className="text-xs text-zinc-600">Reviewed {formatDate(appeal.reviewedAt)}{appeal.reviewedBy ? ` by ${appeal.reviewedBy.name}` : ''}</p>
              )}
            </div>
          ) : submission.appealEligible ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">You can appeal this decision. Explain why you believe the verdict is incorrect.</p>
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
            <p className="text-sm text-zinc-600">This submission is not eligible for appeal.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default SubmissionDetailPage;
