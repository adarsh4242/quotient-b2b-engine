export const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

export const errorHandler = (error, req, res, next) => {
  const status = error.status || (error.name === 'ValidationError' ? 400 : error.code === 11000 ? 409 : 500);
  const message = error.name === 'ValidationError' ? Object.values(error.errors).map((item) => item.message).join(', ') : error.code === 11000 ? 'A record with that unique value already exists' : error.message || 'Server error';
  if (status >= 500) console.error(error);
  res.status(status).json({ message });
};