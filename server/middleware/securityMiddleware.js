import rateLimit from 'express-rate-limit';

// Mongo treats objects like { "$ne": null } as query operators. A login body
// of { email: { "$ne": null } } would otherwise match the first user in the
// collection. Stripping keys that start with $ or contain a dot closes that.
const scrub = (value) => {
  if (Array.isArray(value)) return value.map(scrub);

  if (value && typeof value === 'object') {
    const clean = {};

    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = scrub(v);
    }

    return clean;
  }

  return value;
};

export const sanitize = (req, res, next) => {
  if (req.body) req.body = scrub(req.body);
  if (req.params) req.params = scrub(req.params);

  // req.query is a getter on Express 5, so mutate it rather than reassign
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key];
      } else {
        req.query[key] = scrub(req.query[key]);
      }
    }
  }

  next();
};

// Tight limit on the endpoints worth brute forcing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: 'Too many attempts. Wait fifteen minutes and try again.',
  },
});

// Generous limit on everything else, just to stop runaway scripts
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Slow down a little.' },
});