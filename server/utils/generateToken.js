import jwt from 'jsonwebtoken';

// Anything that isn't explicitly development is treated as production, so a
// forgotten NODE_ENV fails towards the stricter setting rather than the looser
// one. This matches how `secure` was already being decided.
const isProduction = process.env.NODE_ENV !== 'development';

// In production the API (Render) and the React app (Vercel) sit on different
// domains, so the cookie is cross-site. SameSite=strict means the browser
// never attaches it to those requests and every authenticated call 401s.
// SameSite=none fixes that, and browsers only accept none together with
// Secure. Locally both run on localhost, where lax works and Secure would
// stop the cookie being set over plain http.
//
// Exported so the logout route can clear the cookie with identical
// attributes. A mismatch on sameSite, secure or path means the browser
// treats it as a different cookie and refuses to remove it.
export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
};

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export default generateToken;