import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import api from '../../lib/api';

const COLORS = { 'Approved': '#22C55E', 'Flagged for Review': '#F59E0B', 'Blocked': '#EF4444' };
const TAB_OPTIONS = [{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }];

const StatCard = ({ icon: Icon, label, value, color = 'white' }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div className="stat-card-icon">
        <Icon size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</p>
        <p className="stat-card-value" style={{ color }}>{value ?? '—'}</p>
      </div>
    </div>
  </div>
);

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</p>
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
          <div className="tab-bar">
            {TAB_OPTIONS.map(t => (
              <button key={t.value} onClick={() => setDays(t.value)}
                className={`tab-btn ${days === t.value ? 'active' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><div className="spinner spinner-lg" /></div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <StatCard icon={FileText} label="Total Submissions" value={totalSubmissions} />
            <StatCard icon={AlertTriangle} label="Flagged" value={flagged} color="#fbbf24" />
            <StatCard icon={XCircle} label="Blocked" value={blocked} color="#f87171" />
            <StatCard icon={TrendingUp} label="Resolution Rate"
              value={data?.appealStats?.resolutionRate != null ? `${data.appealStats.resolutionRate.toFixed(0)}%` : '—'}
              color="#818cf8" />
          </div>

          {/* Charts grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Card>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Submission Volume</h3></CardHeader>
              <CardBody>
                {data?.submissionVolume?.length ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.submissionVolume}>
                      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={customTooltip} />
                      <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0' }}>No data for this period</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Verdict Distribution</h3></CardHeader>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {data.verdictByOutcome.map(v => (
                        <div key={v.outcome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[v.outcome] }} />
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{v.outcome}</span>
                          </div>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{v.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0' }}>No data</p>}
              </CardBody>
            </Card>
          </div>

          {/* Category breakdown + appeal stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Top Triggered Categories</h3></CardHeader>
              <CardBody>
                {data?.verdictByCategory?.length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.verdictByCategory} layout="vertical">
                      <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="category" type="category" width={140} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={customTooltip} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0' }}>No violations in this period</p>}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Appeal Stats</h3></CardHeader>
              <CardBody>
                {data?.appealStats ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { label: 'Total Appeals', value: data.appealStats.total, color: 'white' },
                      { label: 'Pending', value: data.appealStats.pending, color: '#a5b4fc' },
                      { label: 'Accepted', value: data.appealStats.accepted, color: '#4ade80' },
                      { label: 'Rejected', value: data.appealStats.rejected, color: '#f87171' },
                      { label: 'Resolution Rate', value: `${data.appealStats.resolutionRate?.toFixed(1)}%`, color: '#818cf8' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '32px 0' }}>No appeal data</p>}
              </CardBody>
            </Card>
          </div>

          {/* User rankings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Top Users by Submissions', data: data?.topUsersBySubmissions, key: 'submissionCount', label: 'Submissions' },
              { title: 'Top Users by Violations', data: data?.topUsersByViolations, key: 'violationCount', label: 'Violations' },
            ].map(({ title, data: rows, key, label }) => (
              <Card key={title}>
                <CardHeader><h3 style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{title}</h3></CardHeader>
                <CardBody className="!p-0" style={{ padding: 0 }}>
                  {rows?.length ? (
                    <div className="divide-subtle">
                      {rows.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px' }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', width: 20 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</p>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{r[key]}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '24px 0' }}>No data</p>}
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
