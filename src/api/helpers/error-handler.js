module.exports = errorHandler;

function errorHandler(err, req, res, next) {
  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized error') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Something goes wrong' });
}
