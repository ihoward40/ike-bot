# IKE-BOT Deployment Guide

## Deployment Options

IKE-BOT can be deployed to various platforms. This guide covers the most common options.

## Prerequisites

Before deploying:
- Ensure all environment variables are configured
- Run `npm run build` locally to verify the build works
- Set up your Supabase database (see SETUP.md)
- Configure Notion integration (see SETUP.md)

## Option 1: Docker

### Setup

1. **Create `Dockerfile`:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. **Build and run:**
```bash
docker build -t ike-bot .
docker run -p 3000:3000 --env-file .env ike-bot
```

## Option 2: Cloud Platforms

### Heroku
```bash
heroku create ike-bot-api
heroku config:set NODE_ENV=production JWT_SECRET=your-secret
git push heroku main
```

### DigitalOcean App Platform
- Connect GitHub repository
- Build Command: `npm run build`
- Run Command: `npm start`
- Add environment variables in settings

## Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<strong-random-secret>
SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>
NOTION_API_KEY=<your-key>
NOTION_ACTIVITY_LOG=<your-db-id>
NOTION_FILINGS_DB=<your-db-id>
```

## CI/CD with GitHub Actions

The project includes `.github/workflows/ci.yml` for:
- Automated testing on push/PR
- Building TypeScript
- Security audits
- Deployment automation

## Security Checklist

- [ ] Use strong JWT secret (32+ random characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables
- [ ] Enable Supabase RLS
- [ ] Regular security updates
- [ ] Set up monitoring

## Support

For deployment issues, refer to:
- [API Documentation](./API.md)
- [Setup Guide](./SETUP.md)
- [GitHub Issues](https://github.com/ihoward40/ike-bot/issues)
