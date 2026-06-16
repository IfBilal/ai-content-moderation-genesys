import User from '../models/User.js';
import Policy, { CATEGORIES } from '../models/Policy.js';

export const seedAdmin = async () => {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
  }

  const exists = await User.findOne({ role: 'admin' });
  if (exists) return;

  await User.create({
    name: 'Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
  });

  console.log('Admin account created');
};

export const seedPolicies = async () => {
  for (const category of CATEGORIES) {
    await Policy.findOneAndUpdate(
      { category },
      { category },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Policies seeded');
};
