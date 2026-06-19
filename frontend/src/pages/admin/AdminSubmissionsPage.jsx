import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

const OUTCOMES = ['Flagged for Review','Blocked','Approved','Pending','all'];

const AdminSubmissionsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState('Flagged for Review');

  const fetchSubmissions = async (o = outcome, page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/submissions', { params: { outcome: o, page, limit: 20 } });
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch {/* silent */} finally { setLoading(false); }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const changeOutcome = (o) => { setOutcome(o); fetchSubmissions(o, 1); };

  return (
    <div>
      <PageHeader title="Submissions Queue" subtitle={`${pagination.total} submissions`} />

      <div className="tab-bar" style={{ marginBottom: 24 }}>
        {OUTCOMES.map(o => (
          <button key={o} onClick={() => changeOutcome(o)}
            className={`tab-btn ${outcome === o ? 'active' : ''}`}>
            {o === 'all' ? 'All' : o}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner spinner-lg" /></div>
      ) : submissions.length === 0 ? (
        <Card><CardBody><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0' }}>No submissions found.</p></CardBody></Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className="mod-table">
              <thead>
                <tr>
                  {['Date','User','Images','Outcome','Categories',''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/admin/submissions/${s._id}`)}>
                    <td style={{ color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(s.createdAt)}</td>
                    <td>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'white' }}>{s.user?.name}</p>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{s.user?.email}</p>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{s.images?.length || 0}</td>
                    <td><OutcomeBadge outcome={s.overallOutcome} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {s.triggeredCategories?.slice(0, 2).map(c => (
                          <span key={c} className="category-chip">{c}</span>
                        ))}
                        {s.triggeredCategories?.length > 2 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>+{s.triggeredCategories.length - 2}</span>}
                        {!s.triggeredCategories?.length && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>—</span>}
                      </div>
                    </td>
                    <td><ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.15)' }} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="secondary" disabled={pagination.page === 1}
                  onClick={() => fetchSubmissions(outcome, pagination.page - 1)}><ChevronLeft size={13} /></Button>
                <Button size="sm" variant="secondary" disabled={pagination.page === pagination.pages}
                  onClick={() => fetchSubmissions(outcome, pagination.page + 1)}><ChevronRight size={13} /></Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminSubmissionsPage;
