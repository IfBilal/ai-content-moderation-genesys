import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import { OutcomeBadge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
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

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white/3 border border-white/10 rounded-xl p-1 w-fit">
        {OUTCOMES.map(o => (
          <button key={o} onClick={() => changeOutcome(o)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${outcome === o ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
            {o === 'all' ? 'All' : o}
          </button>
        ))}
      </div>

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
                  {['Date','User','Images','Outcome','Categories',''].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <motion.tr key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/admin/submissions/${s._id}`)}
                    className="border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-white font-medium">{s.user?.name}</p>
                      <p className="text-[10px] text-zinc-600">{s.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">{s.images?.length || 0}</td>
                    <td className="px-6 py-4"><OutcomeBadge outcome={s.overallOutcome} /></td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {s.triggeredCategories?.slice(0, 2).map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-zinc-500">{c}</span>
                        ))}
                        {s.triggeredCategories?.length > 2 && <span className="text-[10px] text-zinc-600">+{s.triggeredCategories.length - 2}</span>}
                        {!s.triggeredCategories?.length && <span className="text-xs text-zinc-700">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4"><ArrowRight size={13} className="text-zinc-700" /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <span className="text-xs text-zinc-600">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
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
