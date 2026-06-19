import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
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

      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {STATUSES.map(s => (
          <button key={s} onClick={() => changeStatus(s)}
            className={`tab-btn ${status === s ? 'active' : ''}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner spinner-lg" /></div>
      ) : appeals.length === 0 ? (
        <Card><CardBody><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0' }}>No appeals found.</p></CardBody></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {appeals.map((a, i) => (
            <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hover>
                <CardBody>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{a.user?.name}</p>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{a.user?.email}</span>
                        <AppealBadge status={a.status} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Submission outcome:</span>
                        <OutcomeBadge outcome={a.submission?.overallOutcome} />
                        {a.submission?.triggeredCategories?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {a.submission.triggeredCategories.slice(0, 2).map(c => (
                              <span key={c} className="category-chip">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>&ldquo;{a.justification}&rdquo;</p>
                      {a.adminResponse && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Admin: {a.adminResponse}</p>
                      )}
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>{formatDate(a.createdAt)}</p>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selected.submission?.images?.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                  Disputed image{selected.submission.images.length > 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selected.submission.images.map(img => (
                    <a key={img._id} href={`/uploads/${img.filename}`} target="_blank" rel="noopener noreferrer"
                      title={img.originalName}>
                      <img src={`/uploads/${img.filename}`} alt={img.originalName}
                        style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Justification from {selected.user?.name}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{selected.justification}</p>
            </div>
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
