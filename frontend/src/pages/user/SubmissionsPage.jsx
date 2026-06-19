import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

const CATEGORIES = ['Graphic Violence','Hate Symbols','Self-Harm','Extremist Propaganda','Weapons & Contraband','Harassment & Humiliation'];
const OUTCOMES = ['Approved','Flagged for Review','Blocked','Pending'];

const SubmissionsPage = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ outcome: '', category: '', startDate: '', endDate: '' });
  const [applied, setApplied] = useState({});

  const fetchSubmissions = async (f = applied, page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...f };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/submissions', { params });
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const applyFilters = () => { setApplied(filters); fetchSubmissions(filters, 1); };
  const clearFilters = () => { const empty = { outcome: '', category: '', startDate: '', endDate: '' }; setFilters(empty); setApplied(empty); fetchSubmissions(empty, 1); };

  return (
    <div>
      <PageHeader title="My Submissions" subtitle={`${pagination.total} total submissions`} />

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <CardBody>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Filter size={14} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <select value={filters.outcome} onChange={e => setFilters({ ...filters, outcome: e.target.value })}
              className="form-input" style={{ width: 'auto', padding: '6px 28px 6px 12px', fontSize: 12 }}>
              <option value="">All Outcomes</option>
              {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
              className="form-input" style={{ width: 'auto', padding: '6px 28px 6px 12px', fontSize: 12 }}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 12, colorScheme: 'dark' }} />
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 12, colorScheme: 'dark' }} />
            <Button size="sm" onClick={applyFilters}>Apply</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
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
                  {['Date','Images','Outcome','Categories','Appeal',''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/submissions/${s._id}`)}>
                    <td style={{ color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(s.createdAt)}</td>
                    <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{s.images?.length || 0}</td>
                    <td><OutcomeBadge outcome={s.overallOutcome} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 260 }}>
                        {s.triggeredCategories?.slice(0, 2).map(c => (
                          <span key={c} className="category-chip">{c}</span>
                        ))}
                        {s.triggeredCategories?.length > 2 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>+{s.triggeredCategories.length - 2}</span>}
                        {!s.triggeredCategories?.length && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      {s.appealStatus ? <AppealBadge status={s.appealStatus} /> : <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>—</span>}
                    </td>
                    <td><ArrowRight size={13} style={{ color: 'rgba(255,255,255,0.15)' }} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Page {pagination.page} of {pagination.pages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="sm" variant="secondary" disabled={pagination.page === 1}
                  onClick={() => fetchSubmissions(applied, pagination.page - 1)}>
                  <ChevronLeft size={13} />
                </Button>
                <Button size="sm" variant="secondary" disabled={pagination.page === pagination.pages}
                  onClick={() => fetchSubmissions(applied, pagination.page + 1)}>
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SubmissionsPage;
