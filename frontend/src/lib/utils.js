import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const truncate = (str, n = 20) =>
  str?.length > n ? str.slice(0, n) + '...' : str;

export const outcomeColor = (outcome) => {
  const map = {
    'Approved': { background: 'rgba(34,197,94,0.12)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.25)' },
    'Flagged for Review': { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.25)' },
    'Blocked': { background: 'rgba(239,68,68,0.12)', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' },
    'Pending': { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.25)' },
  };
  return map[outcome] || { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)' };
};

export const appealStatusColor = (status) => {
  const map = {
    'Pending': { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.25)' },
    'Accepted': { background: 'rgba(34,197,94,0.12)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.25)' },
    'Rejected': { background: 'rgba(239,68,68,0.12)', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' },
  };
  return map[status] || { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)' };
};
