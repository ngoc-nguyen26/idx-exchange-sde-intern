function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`
    );
  });

  next();
}

module.exports = requestLogger;