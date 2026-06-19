import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertTriangle, XCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const ENFORCEMENT_OPTIONS = [
  { value: 'Auto-Block', label: 'Auto-Block', icon: XCircle, color: '#f87171' },
  { value: 'Flag for Review', label: 'Flag for Review', icon: AlertTriangle, color: '#fbbf24' },
];

const CATEGORY_ICONS = {
  'Graphic Violence': '⚔️',
  'Hate Symbols': '🚫',
  'Self-Harm': '💙',
  'Extremist Propaganda': '📢',
  'Weapons & Contraband': '🔫',
  'Harassment & Humiliation': '🚷',
};

const PolicyCard = ({ policy: initial }) => {
  const [policy, setPolicy] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (field, value) => {
    setPolicy(p => ({ ...p, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/policies/${policy._id}`, {
        enabled: policy.enabled,
        confidenceThreshold: policy.confidenceThreshold,
        enforcementBehavior: policy.enforcementBehavior,
      });
      setPolicy(data);
      setDirty(false);
      toast.success(`${policy.category} policy saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <Card hover style={{ opacity: policy.enabled ? 1 : 0.5 }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[policy.category] || '🔍'}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'white' }}>{policy.category}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>
                {policy.enabled ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={() => update('enabled', !policy.enabled)}
            className={`toggle ${policy.enabled ? 'on' : ''}`}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Confidence threshold</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'white' }}>{policy.confidenceThreshold}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={5}
              value={policy.confidenceThreshold}
              onChange={e => update('confidenceThreshold', Number(e.target.value))}
              disabled={!policy.enabled}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>0%</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>100%</span>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Enforcement</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {ENFORCEMENT_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => update('enforcementBehavior', value)}
                  disabled={!policy.enabled}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: policy.enforcementBehavior === value ? 'rgba(255,255,255,0.06)' : 'transparent',
                    border: `1px solid ${policy.enforcementBehavior === value ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                    color: policy.enforcementBehavior === value ? color : 'rgba(255,255,255,0.3)',
                    opacity: !policy.enabled ? 0.5 : 1,
                  }}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dirty && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  color: '#818cf8', transition: 'all 0.2s',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? <div className="spinner spinner-sm" /> : <Save size={12} />}
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </motion.div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

const PoliciesPage = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/policies')
      .then(({ data }) => setPolicies(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Content Policies"
        subtitle="Configure moderation rules per category"
      />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}><div className="spinner spinner-lg" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {policies.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <PolicyCard policy={p} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PoliciesPage;
