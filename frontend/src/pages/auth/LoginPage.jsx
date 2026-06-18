import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const LoginPage = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
        <motion.div variants={item} className="text-center mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Sign in</h1>
          <p className="text-sm text-zinc-500 mt-1">Access your moderation dashboard</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={item}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />
          </motion.div>
          <motion.div variants={item}>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
            />
          </motion.div>
          <motion.div variants={item}>
            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Sign in
            </Button>
          </motion.div>
        </form>

        <motion.p variants={item} className="text-center text-sm text-zinc-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
            Create one
          </Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
