/**
 * Sample Incidents for Demonstration
 * 
 * Note: These incidents are marked with `isSample: true` and are NOT automatically 
 * assumed to be in Hindsight. Users can click "Seed Knowledge Base to Hindsight" 
 * to store these historical postmortems in their live Hindsight bank.
 */

export const SAMPLE_INCIDENTS = [
  {
    id: "SAMPLE-INC-101",
    title: "PostgreSQL Connection Pool Exhaustion on Checkout Service",
    service: "checkout-api",
    severity: "P1 - Critical",
    description: "Checkout API latency spiked to >15s, returning 504 Gateway Timeout during flash sale. New incoming purchase requests failing with DB connection timeouts.",
    logs: `[ERROR] 2026-09-28 14:22:01.402 [checkout-api] [PoolManager] AcquisitionTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.
[ERROR] 2026-09-28 14:22:01.403 [checkout-api] postgres: FATAL: remaining connection slots are reserved for non-replication superuser connections
[WARN] 2026-09-28 14:22:01.890 [ingress-nginx] 504 Gateway Time-out upstream: 10.244.3.44:8080 request: "POST /api/v1/checkout/pay"
[DEBUG] Active connections: 100/100. Waiting queue size: 1420. Idle clients: 0.`,
    isSample: true,
    historicalRecord: {
      pastIncidentId: "INC-2025-042",
      title: "PostgreSQL Connection Pool Exhaustion under Webhook Spike",
      service: "checkout-api",
      rootCause: "A third-party payment provider webhook retry storm triggered unbounded uncommitted transactions. Transaction timeout (idle_in_transaction_session_timeout) was set to 0 (disabled), causing orphaned connections to monopolize pgBouncer client slots.",
      resolution: "1. Terminated orphaned connections using pg_terminate_backend(pid) where state = 'idle in transaction'.\n2. Set idle_in_transaction_session_timeout = '15s' and statement_timeout = '30s' in PostgreSQL config.\n3. Increased pgBouncer max_client_conn from 100 to 350 and default_pool_size to 50.\n4. Added exponential backoff and circuit breaker to incoming webhook processor.",
      preventativeAction: "Enforced database connection pooling health check metric 'db.pool.utilization' with PagerDuty alert at 80% threshold.",
      tags: ["postgres", "connection-pool", "timeout", "pgbouncer", "checkout-api", "p1"]
    }
  },
  {
    id: "SAMPLE-INC-102",
    title: "Redis Cluster Cache Stampede & 99% CPU after Midnight Cron",
    service: "catalog-service",
    severity: "P2 - High",
    description: "Product catalog response times degraded from 35ms to 8,200ms. Redis primary instance CPU pegged at 99%, cache hit ratio dropped precipitously from 98.4% to 12.1%.",
    logs: `[WARN] 2026-09-28 00:00:15.112 [catalog-service] Cache miss for key 'catalog:category:trending:v2'
[ERROR] 2026-09-28 00:00:16.892 [redis-cluster-node-0] Server: CPU usage at 99.4%, slowlog len: 450 items > 100ms
[WARN] 2026-09-28 00:00:18.004 [catalog-service] Database read replica 'db-read-02' query queue depth exceeded 800
[INFO] Simultaneous incoming requests for same invalidated keys: 4,200 req/sec`,
    isSample: true,
    historicalRecord: {
      pastIncidentId: "INC-2025-078",
      title: "Redis Cache Stampede after Synchronized Daily Expirations",
      service: "catalog-service",
      rootCause: "All category and homepage cache keys were configured with hardcoded static TTL (86400s) set at midnight. When expired simultaneously, thousands of parallel worker requests caused a dogpiling cache stampede hitting the primary PostgreSQL read replica.",
      resolution: "1. Implemented cache TTL jitter: newTTL = baseTTL + uniform_random(-300, 300) seconds to spread expirations.\n2. Enabled distributed lock (Redlock / singleflight mutex) on cache miss so only one worker repopulates the cache while others await result.\n3. Flushed stuck slow queries on catalog read replica.",
      preventativeAction: "Adopted stale-while-revalidate caching pattern across catalog-service microservices.",
      tags: ["redis", "cache-stampede", "cpu-spike", "catalog-service", "singleflight", "p2"]
    }
  },
  {
    id: "SAMPLE-INC-103",
    title: "Kubernetes OOMKilled CrashLoopBackOff on Document Exporter",
    service: "pdf-export-worker",
    severity: "P2 - High",
    description: "Workers processing bulk invoice export jobs continuously crash with exit code 137. Queue lag in RabbitMQ growing by 2,000 tasks/min.",
    logs: `[FATAL] 2026-09-28 08:14:02.103 [pdf-export-worker-7d9f-xk2] Container pdf-worker terminated with exit code 137 (OOMKilled)
[INFO] 2026-09-28 08:14:04.221 [k8s-kubelet] Node worker-node-04: Memory cgroup out of memory: Killed process 31442 (node) total-vm:4194304kB, anon-rss:2097152kB
[WARN] 2026-09-28 08:14:10.000 [pdf-export-worker-7d9f-xk2] Pod restarting: CrashLoopBackOff (restarts: 6)
[DEBUG] Memory dump reveals V8 heap allocation failed - JavaScript heap out of memory during PDFKit buffer concatenation.`,
    isSample: true,
    historicalRecord: {
      pastIncidentId: "INC-2025-109",
      title: "PDF Exporter Worker OOM Crashes on Unbounded Buffer Accumulation",
      service: "pdf-export-worker",
      rootCause: "PDF generation pipeline was reading high-resolution customer images into in-memory ArrayBuffers and concatenating chunks directly in Node.js V8 memory without disk streaming. Reports exceeding 500 pages exceeded the 2GB container memory limit.",
      resolution: "1. Refactored PDF renderer to stream output directly into S3 multipart upload using PassThrough stream instead of in-memory Buffer.concat.\n2. Configured --max-old-space-size=3072 and bumped k8s pod memory limit to 4Gi.\n3. Added worker job batch chunking (max 50 invoices per worker task).",
      preventativeAction: "Added unit and load test verifying peak memory does not scale linearly with export page count.",
      tags: ["kubernetes", "oomkilled", "memory-leak", "pdf-export-worker", "streams", "node", "p2"]
    }
  },
  {
    id: "SAMPLE-INC-104",
    title: "Stale JWT Signature Verification Failure After IdP Key Rotation",
    service: "auth-gateway",
    severity: "P1 - Critical",
    description: "Following scheduled enterprise Okta/Auth0 key rotation, all API requests suddenly rejected with HTTP 401 Unauthorized across mobile and web clients.",
    logs: `[ERROR] 2026-09-28 11:05:12.331 [auth-gateway] JsonWebTokenError: invalid signature
[DEBUG] 2026-09-28 11:05:12.332 [auth-gateway] Token kid 'kid-2026-q3' not found in cached JWKS keystore. Available kids: ['kid-2025-q4', 'kid-2026-q1']
[WARN] 2026-09-28 11:05:14.990 [auth-gateway] 401 Unauthorized rate jumped to 94.2% across /api/* endpoints
[INFO] JWKS client cache TTL remaining: 21 hours 44 minutes.`,
    isSample: true,
    historicalRecord: {
      pastIncidentId: "INC-2025-131",
      title: "Authentication Gateway 401 Outage Caused by Stale JWKS Cache",
      service: "auth-gateway",
      rootCause: "jwks-rsa client was initialized with jwksRequestsPerMinute: 10, cache: true, but cacheMaxAge was set to 24 hours without an auto-refresh fallback on unknown kid. When the IdP rotated to a new signing key, auth-gateway kept verifying against old cached keys.",
      resolution: "1. Restarted auth-gateway deployment to immediately invalidate in-memory JWKS cache.\n2. Updated jwks-rsa configuration: set cacheMaxAge: 10 minutes and enabled rateLimit: true with dynamic on-demand fetch when unknown kid is encountered.\n3. Verified token verification against both old and new IdP keys.",
      preventativeAction: "Integrated IdP key rotation webhook to trigger JWKS cache eviction ahead of active rotation.",
      tags: ["auth", "jwt", "jwks", "401-unauthorized", "auth-gateway", "security", "p1"]
    }
  }
];
