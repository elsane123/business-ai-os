
## 🔐 Cron Jobs — Authentification

Les endpoints cron sont protégés par le header `x-cron-secret`.

### Secret
Défini dans `.env` : `CRON_SECRET=<valeur>`

### Appels manuels
```bash
# Daily Focus (email 8h UTC)
curl -H 'x-cron-secret: <CRON_SECRET>' https://brainlo.ai/api/cron/daily-focus

# Rapport mensuel (1er du mois 9h UTC)
curl -H 'x-cron-secret: <CRON_SECRET>' https://brainlo.ai/api/cron/monthly-report

# Wiki lint hebdomadaire (lundi 9h UTC)
curl -H 'x-cron-secret: <CRON_SECRET>' https://brainlo.ai/api/cron/wiki-lint
```

### Crontab
```
0 8 * * *   curl -H 'x-cron-secret: <CRON_SECRET>' http://localhost:50082/api/cron/daily-focus
0 9 1 * *   curl -H 'x-cron-secret: <CRON_SECRET>' http://localhost:50082/api/cron/monthly-report
0 9 * * 1   curl -H 'x-cron-secret: <CRON_SECRET>' http://localhost:50082/api/cron/wiki-lint
```

