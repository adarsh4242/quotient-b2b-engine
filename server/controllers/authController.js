import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Email is already registered' });
  const user = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), role: role === 'admin' || role === 'sales' ? role : 'buyer' });
  res.status(201).json({ token: generateToken(user), user: publicUser(user) });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: generateToken(user), user: publicUser(user) });
};

export const me = async (req, res) => res.json({ user: publicUser(req.user) });