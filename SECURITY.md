# Security & Credentials

## No Hardcoded Credentials

This application does **NOT** contain any hardcoded database credentials.

### How Credentials Are Managed

All sensitive information is passed via **environment variables**:

```
Docker Image
    ↓
Environment Variables (set at runtime)
    ↓
Application
```

### Environment Variables Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_HOST` | MySQL server hostname/IP | `192.168.0.50` or `mysql` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `your_secure_password` |
| `DB_NAME` | Database name | `blockapp_db` |
| `PORT` | Node.js server port | `5000` |

### How to Set Credentials

#### Option 1: Docker Run Command
```bash
docker run -d \
  -e DB_HOST=192.168.0.50 \
  -e DB_USER=root \
  -e DB_PASSWORD=your_password \
  -e DB_NAME=blockapp_db \
  -e PORT=5000 \
  192.168.0.101:8080/blockapp:latest
```

#### Option 2: Docker Compose (.env file)
Create `.env` file in the same directory as `docker-compose.yml`:

```
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=blockapp_db
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=blockapp_db
PORT=5000
```

Then run:
```bash
docker-compose up -d
```

### Files to Review

- ✅ `docker-compose.yml` - Uses `${VARIABLE}` syntax (no hardcoded values)
- ✅ `server.js` - Reads from `process.env` (no hardcoded values)
- ✅ `Dockerfile` - No credentials embedded
- ✅ `.env.example` - Template only, not used at runtime

### Files NOT Included in Image

These files are NOT copied into the Docker image:
- `.env` - Local development only
- `.env.example` - Template reference

### Best Practices

1. **Never commit `.env` to version control** - Add to `.gitignore`
2. **Use strong passwords** - Especially for production
3. **Rotate credentials regularly** - Update environment variables
4. **Use secrets management** - For enterprise deployments (Kubernetes Secrets, Docker Secrets, etc.)
5. **Restrict database access** - Only allow connections from app container

### Checking What's in the Image

To verify no credentials are embedded:

```bash
# Inspect image layers
docker history 192.168.0.101:8080/blockapp:latest

# Check for hardcoded values
docker run --rm 192.168.0.101:8080/blockapp:latest grep -r "2070" . 2>/dev/null || echo "No credentials found"
```

### Production Recommendations

For production deployments:

1. **Use Docker Secrets** (Swarm mode):
   ```yaml
   services:
     blockapp:
       secrets:
         - db_password
   secrets:
     db_password:
       external: true
   ```

2. **Use Kubernetes Secrets**:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: blockapp-secrets
   type: Opaque
   stringData:
     DB_PASSWORD: your_secure_password
   ```

3. **Use environment variable files**:
   ```bash
   docker run --env-file production.env blockapp:latest
   ```

4. **Use a secrets manager** (HashiCorp Vault, AWS Secrets Manager, etc.)

---

**Remember**: Credentials are your responsibility to manage securely!
