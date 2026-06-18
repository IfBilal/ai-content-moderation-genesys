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
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

const ConfidenceBar = ({ value, triggered }) => (
  <div className="flex items-center gap-2">
    <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${triggered ? 'bg-red-500' : value > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
        style={{ width: `${value}%` }} />
    </div>
    <span className="text-xs text-zinc-500 w-8">{value}%</span>
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-zinc-500 text-sm text-center py-20">Submission not found.</div>;

  const { submission, verdicts, appeal } = data;
  const policySnapshot = verdicts[0]?.policySnapshot || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/admin/submissions')} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Submission Review"
          subtitle={`${submission.user?.name} · ${formatDate(submission.createdAt)}`}
        />
        <div className="flex items-center gap-3">
          <OutcomeBadge outcome={submission.overallOutcome} />
          <Button size="sm" variant="secondary" onClick={() => setOverrideModal(true)}>Override Verdict</Button>
        </div>
      </div>

      {/* User info */}
      <Card className="mb-6">
        <CardBody className="!py-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
              {submission.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{submission.user?.name}</p>
              <p className="text-xs text-zinc-500">{submission.user?.email}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Verdicts */}
      <div className="space-y-4 mb-6">
        {verdicts.map((v, i) => (
          <Card key={v._id}>
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
                        {c.detected ? <CheckCircle size={14} className="text-red-400" /> : <MinusCircle size={14} className="text-zinc-700" />}
                      </td>
                      <td className="py-2.5 pr-4"><ConfidenceBar value={c.confidence} triggered={c.triggered} /></td>
                      <td className="py-2.5 pr-4">
                        {c.triggered ? <XCircle size={13} className="text-red-400" /> : <span className="text-zinc-700 text-xs">—</span>}
                      </td>
                      <td className="py-2.5 text-xs text-zinc-500 italic max-w-xs">{c.reasoning}</td>
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
                    <thead><tr>{['Category','Enabled','Threshold','Enforcement'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-widest pb-3 pr-4">{h}</th>
                    ))}</tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {policySnapshot.map((p, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 text-xs text-zinc-300">{p.category}</td>
                          <td className="py-2 pr-4 text-xs">{p.enabled ? <span className="text-green-400">Yes</span> : <span className="text-zinc-600">No</span>}</td>
                          <td className="py-2 pr-4 text-xs text-zinc-400">{p.confidenceThreshold}%</td>
                          <td className="py-2 text-xs"><span className={p.enforcementBehavior === 'Auto-Block' ? 'text-red-400' : 'text-yellow-400'}>{p.enforcementBehavior}</span></td>
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Appeal</h3>
              <AppealBadge status={appeal.status} />
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Justification from {appeal.user?.name}</p>
                <p className="text-sm text-zinc-300 bg-white/3 border border-white/8 rounded-lg px-3 py-2">{appeal.justification}</p>
              </div>
              {appeal.adminResponse && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Admin response</p>
                  <p className="text-sm text-zinc-300 bg-white/3 border border-white/8 rounded-lg px-3 py-2 italic">{appeal.adminResponse}</p>
                </div>
              )}
              {appeal.status === 'Pending' && (
                <Button size="sm" onClick={() => setReviewModal(true)}>Review Appeal</Button>
              )}
              {appeal.reviewedAt && (
                <p className="text-xs text-zinc-600">Reviewed {formatDate(appeal.reviewedAt)}</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Override modal */}
      <Modal open={overrideModal} onClose={() => setOverrideModal(false)} title="Override Verdict">
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">This will update the submission and all image verdicts immediately.</p>
          <div>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest block mb-1.5">New Outcome</label>
            <select value={overrideOutcome} onChange={e => setOverrideOutcome(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none">
              <option>Approved</option>
              <option>Flagged for Review</option>
              <option>Blocked</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setOverrideModal(false)}>Cancel</Button>
            <Button size="sm" loading={overrideLoading} onClick={handleOverride}>Confirm Override</Button>
          </div>
        </div>
      </Modal>

      {/* Appeal review modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Review Appeal">
        <div className="space-y-4">
          <div className="flex gap-2">
            {['Accepted','Rejected'].map(s => (
              <button key={s} onClick={() => setReviewStatus(s)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  reviewStatus === s
                    ? s === 'Accepted' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-white/3 border-white/10 text-zinc-500'
                }`}>
                {s}
              </button>
            ))}
          </div>
          <Textarea label="Response (optional)" placeholder="Write a response to the user..."
            rows={3} value={reviewResponse} onChange={e => setReviewResponse(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setReviewModal(false)}>Cancel</Button>
            <Button size="sm" loading={reviewLoading} onClick={handleAppealReview}>Submit Review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminSubmissionDetailPage;
