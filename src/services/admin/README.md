# 📊 Application Monitoring Dashboard

This document outlines everything being monitored for the application through the **Admin Dashboard**.

---

## 🚦 Health Monitoring

- **Service Health [Severity: High]**
  - Application container status (running/stopped/restarting).
  - Database container status.
  - API availability check (`/health` endpoint).

- **Resource Utilization [Severity: Low]**
  - CPU usage per service.
  - Memory consumption.
  - Disk usage (volume mounts).
  - Network traffic (in/out).

---

## 📑 Logs & Events

- **Application Logs**
  - All logs from deployed service.
  - Error tracking and structured error logs.

- **Kab-Connect Logs**
  - Precise number of active user session i.e connected users.
  - Precise number of users that connected in a day.
  - Precise number of users that connected in a week.
  - Precise number of users that connected in a month.
  - Precise number of users that connected in a year.
  - Total payment made per day.
  - Total payment made per week.
  - Total payment made per month.
  - Total payment made per year.
  - Total all time payment.

- **System Logs**
  - Container lifecycle events (start, stop, crash).
  - Deployment/build logs.

---

## 🗄️ Database Monitoring

- Database connection health.
- Query performance (slow queries).
- Active connections.
- Replication status (if enabled).
- Disk space usage for database storage.

---

## 🔐 Security Monitoring

- Failed login attempts (auth service).
- Unauthorized access attempts.
- Audit logs for admin actions.

---

## 📈 Metrics & Performance

- API request rate (requests/sec).
- API response times (latency, p95, p99).
- Error rates (4xx/5xx responses).
- Background job/task queue health (if enabled).

---

## 🔔 Alerts & Notifications

- Service down alert.
- High CPU/Memory threshold breach.
- Database unavailable.
- High error rate spike.
- SSL/TLS certificate expiry.

---

## 🛠️ Tools Used

- **Prometheus + Grafana** → Metrics and visualization.
- **Loki (or ELK stack)** → Logs collection & search.
- **Alertmanager** → Notifications to Slack/Email.
- **cAdvisor / Node Exporter** → Container & system metrics.

---
