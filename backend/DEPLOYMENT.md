# Deployment Guide

This guide covers deploying the Loyalty Platform backend to various platforms.

## Prerequisites

- Node.js 20+ installed
- Environment variables configured (see `.env.example`)
- Database setup (if using Firebase/Supabase)

## Local Development

```bash
cd backend
npm install
npm run dev
```

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t loyalty-backend .

# Run container
docker run -p 3000:3000 --env-file .env loyalty-backend
```

### Docker Compose

```bash
docker-compose up -d
```

## Railway Deployment

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize project:**
   ```bash
   railway init
   ```

3. **Set environment variables:**
   ```bash
   railway variables set JWT_SECRET=your-secret-key
   railway variables set NODE_ENV=production
   # ... set other variables
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

The `railway.json` file is already configured for automatic builds.

## Render Deployment

1. **Create new Web Service** on Render
2. **Connect your repository**
3. **Configure:**
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** Node
4. **Add environment variables** in Render dashboard
5. **Deploy**

## AWS/EC2 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start with PM2
pm2 start dist/server.js --name loyalty-api

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Systemd

Create `/etc/systemd/system/loyalty-api.service`:

```ini
[Unit]
Description=Loyalty Platform API
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/loyalty-backend
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable loyalty-api
sudo systemctl start loyalty-api
```

## Environment Variables

Required variables (see `.env.example`):

- `JWT_SECRET` - Must be at least 32 characters
- `NODE_ENV` - `development` or `production`
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Frontend URL (use `*` for development only)

Optional:
- `DATABASE_TYPE` - `memory`, `firebase`, or `supabase`
- `LOG_LEVEL` - `DEBUG`, `INFO`, `WARN`, `ERROR`

## Health Check

The API includes a health check endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "message": "Loyalty Platform API is running",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Set up database (Firebase/Supabase) if not using in-memory
- [ ] Enable HTTPS (use reverse proxy like Nginx)
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure rate limiting thresholds
- [ ] Set up backup strategy for database
- [ ] Enable request logging
- [ ] Set up CI/CD pipeline

## Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### Health Check Monitoring

Set up uptime monitoring (UptimeRobot, Pingdom) to check `/health` endpoint.

### Logging

In production, consider:
- **Winston** or **Pino** for structured logging
- **ELK Stack** or **Loki** for log aggregation
- **Sentry** for error tracking

## Scaling

### Horizontal Scaling

- Use load balancer (AWS ALB, Nginx)
- Ensure stateless API (no in-memory sessions)
- Use shared database (not in-memory)

### Vertical Scaling

- Increase server resources
- Use PM2 cluster mode:
  ```bash
  pm2 start dist/server.js -i max
  ```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Environment Variables Not Loading

Ensure `.env` file exists and is in the correct location (backend folder).

### Database Connection Issues

Check database credentials and network connectivity.

## Support

For issues, check:
1. Server logs
2. Health check endpoint
3. Environment variables
4. Database connectivity

