# 🚀 Tiz Lead Scraper - Startup Guide

This guide explains how to start the Tiz Lead Scraper application using the various startup methods available.

## 📋 Quick Start Options

### 1. Docker (Recommended for Production)

#### Windows Users
```bash
# Double-click start.bat or run in command prompt:
start.bat
```

#### Linux/macOS Users
```bash
# Make executable (if needed) and run:
chmod +x start.sh
./start.sh
```

### 2. Direct Python (Development)
```bash
# Install dependencies first:
pip install -r requirements.txt

# Run development server:
python run_dev.py
```

### 3. Manual Docker Commands
```bash
# Stop any existing containers
docker-compose down --remove-orphans

# Build and start
docker-compose up --build -d

# Check status
docker-compose logs -f
```

## 🔧 Features

### Enhanced Port Management
- **Automatic Port Conflict Resolution**: All startup scripts automatically detect and terminate any processes using port 5000
- **Docker Container Cleanup**: Removes any lingering Docker containers using the port
- **Graceful Shutdown**: Attempts graceful termination before force-killing processes

### Robust Error Handling
- **Docker Status Checking**: Verifies Docker is running before attempting startup
- **Dependency Validation**: Checks for required tools and packages
- **Detailed Error Messages**: Provides clear troubleshooting steps when issues occur
- **Timeout Handling**: Waits up to 60 seconds for application startup with progress feedback

### Cross-Platform Support
- **Windows**: `start.bat` with Windows-specific commands
- **Linux/macOS**: `start.sh` with Unix-specific commands
- **Development**: `run_dev.py` for direct Python execution with auto-reload

## 🛠️ Troubleshooting

### Port 5000 Already in Use
The startup scripts automatically handle this, but if you encounter issues:

**Windows:**
```cmd
netstat -an | findstr :5000
taskkill /F /PID <process_id>
```

**Linux/macOS:**
```bash
lsof -i:5000
kill -9 <process_id>
```

### Docker Issues
1. **Docker not running**: Start Docker Desktop or Docker service
2. **Permission errors**: Run as administrator/sudo if needed
3. **Memory issues**: Ensure Docker has sufficient memory allocated

### Application Won't Start
1. Check Docker logs: `docker-compose logs -f`
2. Verify port availability: `lsof -i:5000` (Linux/macOS) or `netstat -an | findstr :5000` (Windows)
3. Restart Docker and try again
4. Check system resources (RAM/CPU usage)

## 📚 Additional Commands

### View Logs
```bash
# Follow live logs
docker-compose logs -f

# View recent logs
docker-compose logs --tail=50
```

### Stop Application
```bash
# Graceful stop
docker-compose down

# Force stop and cleanup
docker-compose down --remove-orphans
```

### Health Check
```bash
# Check if application is running
curl http://localhost:5000/health

# Or visit in browser:
# http://localhost:5000/health
```

## 🔐 Environment Variables

The startup scripts set these defaults:
- `SECRET_KEY`: Application secret key
- `DEBUG`: Debug mode (true for development)
- `LOG_LEVEL`: Logging level (INFO)
- `RATE_LIMIT_REQUESTS`: API rate limiting (100 requests)
- `RATE_LIMIT_WINDOW`: Rate limit window (60 seconds)

You can override these by setting environment variables before running the startup scripts.

## 🎯 Next Steps

1. **Open the application**: http://localhost:5000
2. **Configure API keys** in the Settings page
3. **Start scraping leads** from Apollo.io and Google Maps
4. **Export your data** to CSV, JSON, Google Sheets, or Notion

---

**Need help?** Check the main README.md for detailed configuration and usage instructions. 