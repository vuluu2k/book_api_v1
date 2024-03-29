import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Không thấy accessToken' });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.authId = decoded.authId;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ success: false, message: 'Sai accessToken' });
  }
};
export { verifyToken };
