import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertTriangle, XCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const ENFORCEMENT_OPTIONS = [
  { value: 'Auto-Block', label: 'Auto-Block', icon: XCircle, color: 'text-red-400' },
  { value: 'Flag for Review', label: 'Flag for Review', icon: AlertTriangle, color: 'text-yellow-400' },
];

const CATEGORY_ICONS = {
  'Violence': '⚔️',
  'Hate Speech': '🚫',
  'Nudity': '🔞',
  'Spam': '📧',
  'Misinformation': '❌',
  'Self-Harm': '💙',
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
    <Card hover className={!policy.enabled ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{CATEGORY_ICONS[policy.category] || '🔍'}</span>
            <div>
              <p className="text-sm font-medium text-white">{policy.category}</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
                {policy.enabled ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={() => update('enabled', !policy.enabled)}
            className={`relative w-10 h-5.5 rounded-full transition-all duration-200 focus:outline-none ${
              policy.enabled ? 'bg-blue-500' : 'bg-white/10'
            }`}
            style={{ height: '22px' }}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
              policy.enabled ? 'left-5' : 'left-1'
            }`} />
          </button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs text-zinc-500">Confidence threshold</span>
              <span className="text-xs font-mono text-white">{policy.confidenceThreshold}%</span>
            </div>
            <input
              type="range" min={0} max={100} step={5}
              value={policy.confidenceThreshold}
              onChange={e => update('confidenceThreshold', Number(e.target.value))}
              disabled={!policy.enabled}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-zinc-700">0%</span>
              <span className="text-[10px] text-zinc-700">100%</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-zinc-500 mb-2">Enforcement</p>
            <div className="flex gap-1">
              {ENFORCEMENT_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => update('enforcementBehavior', value)}
                  disabled={!policy.enabled}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    policy.enforcementBehavior === value
                      ? `bg-white/8 border-white/20 ${color}`
                      : 'bg-transparent border-white/8 text-zinc-600 hover:border-white/15'
                  }`}
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
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/15 transition-all disabled:opacity-50"
              >
                {saving ? <Spinner size="sm" /> : <Save size={12} />}
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
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
