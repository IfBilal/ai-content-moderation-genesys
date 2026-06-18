import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge, AppealBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
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
      <Card className="mb-6">
        <CardBody className="!py-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter size={14} className="text-zinc-500" />
            <select value={filters.outcome} onChange={e => setFilters({ ...filters, outcome: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none">
              <option value="">All Outcomes</option>
              {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-400 outline-none" />
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-400 outline-none" />
            <Button size="sm" onClick={applyFilters}>Apply</Button>
            <Button size="sm" variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : submissions.length === 0 ? (
        <Card><CardBody><p className="text-sm text-zinc-600 text-center py-8">No submissions found.</p></CardBody></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Date','Images','Outcome','Categories','Appeal',''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/submissions/${s._id}`)}
                    className="border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{s.images?.length || 0}</td>
                    <td className="px-6 py-4"><OutcomeBadge outcome={s.overallOutcome} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {s.triggeredCategories?.slice(0, 2).map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-zinc-500">{c}</span>
                        ))}
                        {s.triggeredCategories?.length > 2 && <span className="text-[10px] text-zinc-600">+{s.triggeredCategories.length - 2}</span>}
                        {!s.triggeredCategories?.length && <span className="text-xs text-zinc-700">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.appealStatus ? <AppealBadge status={s.appealStatus} /> : <span className="text-xs text-zinc-700">—</span>}
                    </td>
                    <td className="px-6 py-4"><ArrowRight size={13} className="text-zinc-700" /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <span className="text-xs text-zinc-600">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
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
