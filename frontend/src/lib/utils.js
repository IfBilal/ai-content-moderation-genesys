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
    'Approved': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Flagged for Review': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    'Blocked': 'text-red-400 bg-red-500/10 border-red-500/20',
    'Pending': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };
  return map[outcome] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
};

export const appealStatusColor = (status) => {
  const map = {
    'Pending': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    'Accepted': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Rejected': 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return map[status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
};
