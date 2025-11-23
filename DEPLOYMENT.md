# BlockApp Deployment Guide

Your BlockApp has been successfully pushed to the Docker registry at `192.168.0.101:8080/blockapp:latest`

## ⚠️ Important: Set Your Credentials

**Before deploying, you MUST set your own database credentials.**

All credentials are environment variables - they are NOT hardcoded in the image or compose files.

### Files You Need to Configure:

1. **For `docker run` command**: Pass `-e` flags with your credentials
2. **For `docker-compose`: Create a `.env` file with your credentials

See examples below for each deployment option.

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Container                │
├─────────────────────────────────────────┤
│  Nginx (Port 80)                        │
│  ├─ Serves React Frontend               │
│  └─ Proxies /api/* to Node.js           │
│                                         │
│  Node.js Backend (Port 5000)            │
│  └─ Handles API requests                │
│     └─ Connects to MySQL Database       │
└─────────────────────────────────────────┘
         ↓
   MySQL Database
   (192.168.0.50)
```

## Option 1: Run with Existing MySQL Database (Recommended)

If you want to use your existing MySQL database:

```bash
docker run -d \
  -p 80:80 \
  -p 5000:5000 \
  -e DB_HOST=<your-mysql-host> \
  -e DB_USER=<your-db-user> \
  -e DB_PASSWORD=<your-db-password> \
  -e DB_NAME=<your-db-name> \
  -e PORT=5000 \
  --name blockapp \
  192.168.0.101:8080/blockapp:latest
```

**Example:**
```bash
docker run -d \
  -p 80:80 \
  -p 5000:5000 \
  -e DB_HOST=192.168.0.50 \
  -e DB_USER=root \
  -e DB_PASSWORD=your_secure_password \
  -e DB_NAME=blockapp_db \
  -e PORT=5000 \
  --name blockapp \
  192.168.0.101:8080/blockapp:latest
```

**Access the app:**
- Frontend: `http://<server-ip>`
- API: `http://<server-ip>/api`

---

## Option 2: Run with Docker Compose (Includes MySQL)

If you want MySQL to run in a separate container:

**1. Copy `docker-compose.yml` from the repository to your server**

**2. Create `.env` file on your server with your credentials:**

```bash
# Database Configuration
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=your_secure_password_here
DB_NAME=blockapp_db
MYSQL_ROOT_PASSWORD=your_secure_password_here
MYSQL_DATABASE=blockapp_db
PORT=5000
```

**3. Create `init.sql` on your server:**

```sql
CREATE DATABASE IF NOT EXISTS blockapp_db;
USE blockapp_db;

CREATE TABLE IF NOT EXISTS counters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  value INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES counters(user_id)
);

CREATE TABLE IF NOT EXISTS metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  metric_name VARCHAR(100) NOT NULL,
  metric_value INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4. Start the services:**

```bash
docker-compose up -d
```

**Note:** Docker Compose will automatically read the `.env` file and use those values.

**Access the app:**
- Frontend: `http://<server-ip>`
- API: `http://<server-ip>/api`
- MySQL: `localhost:3306` (from server)

---

## Option 3: Run with Multiple Apps (Reverse Proxy)

If you have multiple apps, use Nginx as a reverse proxy:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - blockapp
      - app2
    restart: always

  blockapp:
    image: 192.168.0.101:8080/blockapp:latest
    environment:
      - DB_HOST=192.168.0.50
      - DB_USER=root
      - DB_PASSWORD=2070
      - DB_NAME=blockapp_db
    restart: always

  app2:
    image: 192.168.0.101:8080/app2:latest
    restart: always
```

**nginx-proxy.conf:**

```nginx
events { worker_connections 1024; }

http {
  upstream blockapp { server blockapp:80; }
  upstream app2 { server app2:80; }

  server {
    listen 80;

    location / {
      proxy_pass http://blockapp;
    }

    location /app2 {
      proxy_pass http://app2;
    }
  }
}
```

---

## Useful Commands

```bash
# View running containers
docker ps

# View logs
docker logs blockapp

# Stop the app
docker stop blockapp

# Remove the app
docker rm blockapp

# View database
docker exec blockapp-mysql mysql -uroot -p2070 blockapp_db -e "SELECT * FROM counters;"

# Restart
docker restart blockapp
```

---

## Troubleshooting

**Database connection error:**
- Ensure MySQL is running and accessible
- Check credentials in environment variables
- Verify firewall allows port 3306

**Port already in use:**
```bash
docker stop blockapp
docker rm blockapp
```

**View detailed logs:**
```bash
docker logs -f blockapp
```

---

## Image Details

- **Registry**: `192.168.0.101:8080`
- **Image**: `blockapp:latest`
- **Size**: ~300MB
- **Ports**: 80 (Frontend), 5000 (API)
- **Database**: MySQL 8.0 compatible

---

## What's Included

✅ React Frontend (Nginx)  
✅ Node.js Backend (Express)  
✅ MySQL Database Support  
✅ API Endpoints for Counter  
✅ Activity Logging  
✅ Production-Ready Configuration
