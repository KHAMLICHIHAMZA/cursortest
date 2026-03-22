type RequestSample = {
  durationMs: number;
  statusCode: number;
};

const MAX_SAMPLES_PER_KEY = 300;
const LATENCY_ALERT_MS = 1200;

const metrics = new Map<string, RequestSample[]>();
let total5xx = 0;
let totalRequests = 0;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * q)),
  );
  return sorted[idx];
}

export function recordHttpMetric(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
) {
  totalRequests += 1;
  if (statusCode >= 500) {
    total5xx += 1;
  }

  const key = `${method.toUpperCase()} ${path}`;
  const samples = metrics.get(key) || [];
  samples.push({ durationMs, statusCode });
  if (samples.length > MAX_SAMPLES_PER_KEY) {
    samples.splice(0, samples.length - MAX_SAMPLES_PER_KEY);
  }
  metrics.set(key, samples);
}

export function getHttpMetricsSnapshot() {
  const endpoints = Array.from(metrics.entries()).map(([key, samples]) => {
    const sortedDurations = samples
      .map((s) => s.durationMs)
      .sort((a, b) => a - b);
    const errorCount = samples.filter((s) => s.statusCode >= 500).length;
    const p50 = Number(quantile(sortedDurations, 0.5).toFixed(1));
    const p95 = Number(quantile(sortedDurations, 0.95).toFixed(1));
    const p99 = Number(quantile(sortedDurations, 0.99).toFixed(1));
    return {
      endpoint: key,
      samples: samples.length,
      p50,
      p95,
      p99,
      errorRate:
        samples.length > 0
          ? Number(((errorCount / samples.length) * 100).toFixed(2))
          : 0,
      latencyAlert: p95 > LATENCY_ALERT_MS,
    };
  });

  return {
    totalRequests,
    total5xx,
    global5xxRate:
      totalRequests > 0
        ? Number(((total5xx / totalRequests) * 100).toFixed(2))
        : 0,
    endpoints: endpoints.sort((a, b) => b.p95 - a.p95),
  };
}
