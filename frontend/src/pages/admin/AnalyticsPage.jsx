import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, FileText, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';

const COLORS = { 'Approved': '#22C55E', 'Flagged for Review': '#F59E0B', 'Blocked': '#EF4444' };
const TAB_OPTIONS = [{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }];

const StatCard = ({ icon: Icon, label, value, color = 'text-white' }) => (
  <Card hover>
    <CardBody className="!py-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon size={15} className="text-zinc-400" />
        </div>
        <div>
          <p className="text-xs text-zinc-500">{label}</p>
          <p className={`text-xl font-bold tracking-tight ${color}`}>{value ?? '—'}</p>
        </div>
      </div>
    </CardBody>
  </Card>
);

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

const AnalyticsPage = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get(`/admin/analytics?days=${days}`);
        setData(d);
      } catch {/* silent */} finally { setLoading(false); }
    };
    fetch();
  }, [days]);

  const totalSubmissions = data?.verdictByOutcome?.reduce((a, v) => a + v.count, 0) || 0;
  const flagged = data?.verdictByOutcome?.find(v => v.outcome === 'Flagged for Review')?.count || 0;
  const blocked = data?.verdictByOutcome?.find(v => v.outcome === 'Blocked')?.count || 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Platform-wide moderation insights"
        action={
          <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            {TAB_OPTIONS.map(t => (
              <button key={t.value} onClick={() => setDays(t.value)}
                className={`px-4 py-1.5 text-xs font-medium transition-all ${days === t.value ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Submissions" value={totalSubmissions} />
            <StatCard icon={AlertTriangle} label="Flagged" value={flagged} color="text-yellow-400" />
            <StatCard icon={XCircle} label="Blocked" value={blocked} color="text-red-400" />
            <StatCard icon={TrendingUp} label="Resolution Rate"
              value={data?.appealStats?.resolutionRate != null ? `${data.appealStats.resolutionRate.toFixed(0)}%` : '—'}
              color="text-blue-400" />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Submission volume - full width */}
            <Card className="lg:col-span-2">
              <CardHeader><h3 className="text-sm font-semibold text-white">Submission Volume</h3></CardHeader>
              <CardBody>
                {data?.submissionVolume?.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.submissionVolume}>
                      <XAxis dataKey="date" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={customTooltip} />
                      <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-zinc-600 text-center py-8">No data for this period</p>}
              </CardBody>
            </Card>

            {/* Verdict distribution pie */}
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-white">Verdict Distribution</h3></CardHeader>
              <CardBody>
                {data?.verdictByOutcome?.length ? (
                  <div>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={data.verdictByOutcome} dataKey="count" nameKey="outcome" cx="50%" cy="50%" innerRadius={45} outerRadius={65}>
                          {data.verdictByOutcome.map((v, i) => (
                            <Cell key={i} fill={COLORS[v.outcome] || '#6B7280'} />
                          ))}
                        </Pie>
                        <Tooltip content={customTooltip} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {data.verdictByOutcome.map(v => (
                        <div key={v.outcome} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[v.outcome] }} />
                            <span className="text-xs text-zinc-400">{v.outcome}</span>
                          </div>
                          <span className="text-xs text-zinc-300 font-medium">{v.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-xs text-zinc-600 text-center py-8">No data</p>}
              </CardBody>
            </Card>
          </div>

          {/* Category breakdown + appeal stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-white">Top Triggered Categories</h3></CardHeader>
              <CardBody>
                {data?.verdictByCategory?.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.verdictByCategory} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#52525B', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="category" type="category" width={140} tick={{ fill: '#A1A1AA', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={customTooltip} />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-zinc-600 text-center py-8">No violations in this period</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 className="text-sm font-semibold text-white">Appeal Stats</h3></CardHeader>
              <CardBody>
                {data?.appealStats ? (
                  <div className="space-y-4">
                    {[
                      { label: 'Total Appeals', value: data.appealStats.total, color: 'text-white' },
                      { label: 'Pending', value: data.appealStats.pending, color: 'text-indigo-400' },
                      { label: 'Accepted', value: data.appealStats.accepted, color: 'text-green-400' },
                      { label: 'Rejected', value: data.appealStats.rejected, color: 'text-red-400' },
                      { label: 'Resolution Rate', value: `${data.appealStats.resolutionRate?.toFixed(1)}%`, color: 'text-blue-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <span className="text-xs text-zinc-500">{label}</span>
                        <span className={`text-sm font-semibold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-zinc-600 text-center py-8">No appeal data</p>}
              </CardBody>
            </Card>
          </div>

          {/* User rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { title: 'Top Users by Submissions', data: data?.topUsersBySubmissions, key: 'submissionCount', label: 'Submissions' },
              { title: 'Top Users by Violations', data: data?.topUsersByViolations, key: 'violationCount', label: 'Violations' },
            ].map(({ title, data: rows, key, label }) => (
              <Card key={title}>
                <CardHeader><h3 className="text-sm font-semibold text-white">{title}</h3></CardHeader>
                <CardBody className="!p-0">
                  {rows?.length ? (
                    <div className="divide-y divide-white/5">
                      {rows.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 px-6 py-3">
                          <span className="text-xs text-zinc-700 w-5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{r.name}</p>
                            <p className="text-[10px] text-zinc-600 truncate">{r.email}</p>
                          </div>
                          <span className="text-sm font-semibold text-white">{r[key]}</span>
                          <span className="text-[10px] text-zinc-600">{label}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-zinc-600 text-center py-6">No data</p>}
                </CardBody>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AnalyticsPage;
