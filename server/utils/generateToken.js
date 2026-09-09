import jwt from 'jsonwebtoken';

export const generateToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role, name: user.name, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);