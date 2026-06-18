import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

const STATUSES = ['Pending','Accepted','Rejected','all'];

const AppealsPage = () => {
  const [appeals, setAppeals] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Pending');
  const [selected, setSelected] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Accepted');
  const [reviewResponse, setReviewResponse] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchAppeals = async (s = status, page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/appeals', { params: { status: s, page, limit: 20 } });
      setAppeals(data.appeals);
      setPagination(data.pagination);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchAppeals(); }, []);

  const changeStatus = (s) => { setStatus(s); fetchAppeals(s, 1); };

  const handleReview = async () => {
    setReviewLoading(true);
    try {
      await api.patch(`/admin/appeals/${selected._id}`, { status: reviewStatus, adminResponse: reviewResponse });
      toast.success(`Appeal ${reviewStatus.toLowerCase()}`);
      setSelected(null);
      setReviewResponse('');
      fetchAppeals(status, pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally { setReviewLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Appeals Queue" subtitle={`${pagination.total} appeals`} />

      <div className="flex gap-1 mb-6 bg-white/3 border border-white/10 rounded-xl p-1 w-fit">
        {STATUSES.map(s => (
          <button key={s} onClick={() => changeStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${status === s ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : appeals.length === 0 ? (
        <Card><CardBody><p className="text-sm text-zinc-600 text-center py-8">No appeals found.</p></CardBody></Card>
      ) : (
        <div className="space-y-3">
          {appeals.map((a, i) => (
            <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium text-white">{a.user?.name}</p>
                        <span className="text-xs text-zinc-600">{a.user?.email}</span>
                        <AppealBadge status={a.status} />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-zinc-500">Submission outcome:</span>
                        <OutcomeBadge outcome={a.submission?.overallOutcome} />
                        {a.submission?.triggeredCategories?.length > 0 && (
                          <div className="flex gap-1">
                            {a.submission.triggeredCategories.slice(0, 2).map(c => (
                              <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-zinc-500">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 italic">&ldquo;{a.justification}&rdquo;</p>
                      {a.adminResponse && (
                        <p className="text-xs text-zinc-600 mt-1">Admin: {a.adminResponse}</p>
                      )}
                      <p className="text-[10px] text-zinc-700 mt-2">{formatDate(a.createdAt)}</p>
                    </div>
                    {a.status === 'Pending' && (
                      <Button size="sm" variant="secondary" onClick={() => { setSelected(a); setReviewStatus('Accepted'); setReviewResponse(''); }}>
                        Review
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-600">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={pagination.page === 1}
                  onClick={() => fetchAppeals(status, pagination.page - 1)}><ChevronLeft size={13} /></Button>
                <Button size="sm" variant="secondary" disabled={pagination.page === pagination.pages}
                  onClick={() => fetchAppeals(status, pagination.page + 1)}><ChevronRight size={13} /></Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Review Appeal" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">Justification from {selected.user?.name}</p>
              <p className="text-sm text-zinc-300">{selected.justification}</p>
            </div>
            <div className="flex gap-2">
              {['Accepted','Rejected'].map(s => (
                <button key={s} onClick={() => setReviewStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    reviewStatus === s
                      ? s === 'Accepted' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-white/3 border-white/10 text-zinc-500'
                  }`}>{s}</button>
              ))}
            </div>
            <Textarea label="Response (optional)" placeholder="Write a response to the user..."
              rows={3} value={reviewResponse} onChange={e => setReviewResponse(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>Cancel</Button>
              <Button size="sm" loading={reviewLoading} onClick={handleReview}>Submit Review</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AppealsPage;
