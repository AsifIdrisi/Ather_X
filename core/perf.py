"""Live in-session performance metrics.

Intentionally simple and process-local: these reset whenever the Flask
process restarts, and are only meant for the /api/performance dashboard.
"""

import time

PERF_STARTED_AT = time.perf_counter()
PERF_METRICS = {
    "requests": 0,
    "success": 0,
    "errors": 0,
    "route_counts": {},
    "route_latency_ms": {},
}


def _record_perf(route, started_at, success=True):
    elapsed_ms = round((time.perf_counter() - started_at) * 1000, 1)
    PERF_METRICS["requests"] += 1
    PERF_METRICS["success" if success else "errors"] += 1
    PERF_METRICS["route_counts"][route] = PERF_METRICS["route_counts"].get(route, 0) + 1
    samples = PERF_METRICS["route_latency_ms"].setdefault(route, [])
    samples.append(elapsed_ms)
    if len(samples) > 50:
        del samples[:-50]
    return elapsed_ms
