# 🔒 Configuration Caddy HTTPS — 3 Domaines

**Domaines :** `brainlo.ai` + `www.brainlo.ai`, `agent.cyberquantic.com`, `test.cyberquantic.com`

---

## 1. Caddyfile complet

Remplacez le contenu de votre Caddyfile existant par :

```caddyfile
# ─────────────────────────────────────────────
# BRAINLO.AI — Next.js app (port 50082)
# ─────────────────────────────────────────────
brainlo.ai, www.brainlo.ai {
    # HTTPS automatique via Let's Encrypt
    # Redirection www → sans www (canonique)
    @www host www.brainlo.ai
    redir @www https://brainlo.ai{uri} permanent

    reverse_proxy 172.17.0.1:50082 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Logs
    log {
        output file /var/log/caddy/brainlo.log
        level INFO
    }
}

# ─────────────────────────────────────────────
# AGENT.CYBERQUANTIC.COM — service port 50080
# ─────────────────────────────────────────────
agent.cyberquantic.com {
    reverse_proxy 172.17.0.1:50080 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    log {
        output file /var/log/caddy/agent-cyberquantic.log
        level INFO
    }
}

# ─────────────────────────────────────────────
# TEST.CYBERQUANTIC.COM — adapter le port selon le service
# ─────────────────────────────────────────────
test.cyberquantic.com {
    reverse_proxy 172.17.0.1:PORT_DU_SERVICE {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    log {
        output file /var/log/caddy/test-cyberquantic.log
        level INFO
    }
}
```

> ⚠️ **Remplacer `PORT_DU_SERVICE`** pour `test.cyberquantic.com` par le port réel du service.

---

## 2. Comment appliquer

### Option A — Caddy dans un conteneur Docker

```bash
# 1. Trouver le conteneur Caddy
docker ps | grep caddy

# 2. Voir le Caddyfile actuel
docker exec <caddy-container-id> cat /etc/caddy/Caddyfile

# 3. Copier le nouveau Caddyfile dans le conteneur
docker cp Caddyfile <caddy-container-id>:/etc/caddy/Caddyfile

# 4. Valider la configuration
docker exec <caddy-container-id> caddy validate --config /etc/caddy/Caddyfile

# 5. Recharger (sans downtime)
docker exec <caddy-container-id> caddy reload --config /etc/caddy/Caddyfile
```

### Option B — Caddy installé directement sur le host

```bash
# 1. Trouver le Caddyfile
find / -name Caddyfile 2>/dev/null

# 2. Éditer le Caddyfile (chemin typique)
nano /etc/caddy/Caddyfile
# ou
nano /opt/caddy/Caddyfile

# 3. Valider
caddy validate --config /etc/caddy/Caddyfile

# 4. Recharger sans interruption
systemctl reload caddy
# ou
caddy reload --config /etc/caddy/Caddyfile
```

### Option C — Via l'API admin Caddy (port 2019)

```bash
# Voir la config actuelle
curl http://localhost:2019/config/

# Charger une nouvelle config
curl -X POST http://localhost:2019/load \
  -H "Content-Type: text/caddyfile" \
  --data-binary @/etc/caddy/Caddyfile
```

---

## 3. Vérifications post-déploiement

```bash
# Test HTTPS brainlo.ai
curl -I https://brainlo.ai
# → doit retourner HTTP/2 200 + Strict-Transport-Security

# Test redirection www → sans www
curl -I https://www.brainlo.ai
# → doit retourner 301 vers https://brainlo.ai

# Test HTTP → HTTPS (Caddy le fait automatiquement)
curl -I http://brainlo.ai
# → doit retourner 301 vers https://brainlo.ai

# Test agent.cyberquantic.com
curl -I https://agent.cyberquantic.com

# Test test.cyberquantic.com
curl -I https://test.cyberquantic.com

# Vérifier le certificat SSL
curl -sv https://brainlo.ai 2>&1 | grep -E 'subject|issuer|expire'
```

---

## 4. Prérequis Let's Encrypt

Pour que Caddy génère automatiquement les certificats SSL :

- ✅ Les 3 domaines doivent pointer vers l'IP du serveur (`51.159.164.33`)
- ✅ Le port **443** doit être ouvert sur le firewall
- ✅ Le port **80** doit être ouvert (pour la validation HTTP-01)
- ✅ Caddy doit pouvoir écrire dans son répertoire de données (`~/.local/share/caddy` ou `/var/lib/caddy`)

```bash
# Vérifier que les ports sont ouverts
nc -zv 51.159.164.33 80
nc -zv 51.159.164.33 443

# Vérifier DNS (tous doivent pointer vers 51.159.164.33)
dig brainlo.ai +short
dig www.brainlo.ai +short
dig agent.cyberquantic.com +short
dig test.cyberquantic.com +short
```

---

## 5. Ce que Caddy fait automatiquement

| Fonctionnalité | Caddy |
|---|---|
| Certificat Let's Encrypt | ✅ Automatique |
| Renouvellement certificat | ✅ Automatique |
| Redirection HTTP → HTTPS | ✅ Automatique |
| HTTP/2 | ✅ Automatique |
| TLS 1.3 | ✅ Automatique |
| HSTS (via next.config.js) | ✅ Déjà configuré |