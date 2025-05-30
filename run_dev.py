#!/usr/bin/env python3
"""
Tiz Lead Scraper - Development Runner
Simple script to run the application directly with port conflict handling
"""

import os
import sys
import time
import signal
import psutil
import subprocess
from pathlib import Path

def kill_processes_on_port(port=5000):
    """Kill any processes running on the specified port"""
    print(f"🔍 Checking for existing processes on port {port}...")
    
    killed_any = False
    try:
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                # Use net_connections instead of connections (newer API)
                connections = proc.net_connections() if hasattr(proc, 'net_connections') else []
                for conn in connections:
                    if hasattr(conn, 'laddr') and conn.laddr and conn.laddr.port == port:
                        print(f"🛑 Found process {proc.info['pid']} ({proc.info['name']}) using port {port}. Terminating...")
                        proc.terminate()
                        killed_any = True
                        
                        # Wait for graceful shutdown
                        try:
                            proc.wait(timeout=3)
                        except psutil.TimeoutExpired:
                            print(f"⚡ Force killing process {proc.info['pid']}...")
                            proc.kill()
                        break
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess, AttributeError):
                continue
    except Exception as e:
        print(f"⚠️  Could not check all processes: {e}")
        print("🔄 Trying alternative method...")
        
        # Fallback method using netstat (Windows compatible)
        try:
            import subprocess
            import re
            
            # Use netstat to find processes on port 5000
            result = subprocess.run(['netstat', '-ano'], capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if f':{port}' in line and 'LISTENING' in line:
                        # Extract PID from the line
                        parts = line.split()
                        if len(parts) >= 5:
                            try:
                                pid = int(parts[-1])
                                print(f"🛑 Found process {pid} using port {port}. Terminating...")
                                subprocess.run(['taskkill', '/F', '/PID', str(pid)], 
                                             capture_output=True, check=False)
                                killed_any = True
                            except (ValueError, subprocess.SubprocessError):
                                continue
        except Exception as fallback_error:
            print(f"⚠️  Fallback method also failed: {fallback_error}")
    
    if killed_any:
        print("✅ Port 5000 cleared successfully")
        time.sleep(1)  # Give the OS time to free the port
    else:
        print("✅ Port 5000 is available")
    
    return True

def check_requirements():
    """Check if required packages are installed"""
    print("📦 Checking requirements...")
    
    try:
        # Check if we're in a virtual environment
        if not (hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)):
            print("⚠️  Warning: Not running in a virtual environment")
            print("💡 Consider creating one with: python -m venv venv")
        
        # Try importing required packages
        import fastapi
        import uvicorn
        print("✅ Core packages available")
        
    except ImportError as e:
        print(f"❌ Missing required packages: {e}")
        print("💡 Install with: pip install -r requirements.txt")
        return False
    
    return True

def setup_environment():
    """Setup environment variables"""
    print("🔧 Setting up environment...")
    
    # Set default environment variables if not already set
    defaults = {
        'SECRET_KEY': 'tiz-lead-scraper-dev-secret-key-2024',
        'DEBUG': 'true',
        'LOG_LEVEL': 'INFO',
        'RATE_LIMIT_REQUESTS': '100',
        'RATE_LIMIT_WINDOW': '60'
    }
    
    for key, value in defaults.items():
        if key not in os.environ:
            os.environ[key] = value
    
    print("✅ Environment configured")

def create_directories():
    """Create necessary directories"""
    print("📁 Creating directories...")
    
    directories = ['logs', 'data']
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
    
    print("✅ Directories created")

def run_application():
    """Run the FastAPI application"""
    print("🚀 Starting Tiz Lead Scraper in development mode...")
    
    # Check if app directory exists
    app_dir = Path("app")
    if not app_dir.exists():
        print("❌ App directory not found. Make sure you're in the project root.")
        return False
    
    # Check if main.py exists
    main_file = app_dir / "main.py"
    if not main_file.exists():
        print(f"❌ main.py not found at {main_file}")
        return False
    
    # Add app directory to Python path so imports work
    app_path = str(app_dir.absolute())
    if app_path not in sys.path:
        sys.path.insert(0, app_path)
    
    try:
        # Import and run the application
        import uvicorn
        
        print("✅ Application loaded successfully")
        print("🌐 Starting server on http://localhost:5000")
        print("")
        print("📋 Development Tips:")
        print("• Press Ctrl+C to stop the server")
        print("• Auto-reload is enabled - changes will restart the server")
        print("• API docs available at: http://localhost:5000/docs")
        print("• Health check: http://localhost:5000/health")
        print("• Static files: http://localhost:5000/static/")
        print("")
        
        # Run with auto-reload for development
        uvicorn.run(
            "app.main:app",  # Use module path instead of changing directory
            host="0.0.0.0",
            port=5000,
            reload=True,
            access_log=True,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        return True
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        print(f"💡 Make sure you're in the project root directory")
        print(f"💡 Current directory: {os.getcwd()}")
        print(f"💡 App directory: {app_dir.absolute()}")
        print(f"💡 Main file: {main_file.absolute()}")
        return False

def main():
    """Main function"""
    print("🚀 Tiz Lead Scraper - Development Runner")
    print("=" * 50)
    
    try:
        # Kill processes on port 5000
        kill_processes_on_port(5000)
        
        # Check requirements
        if not check_requirements():
            return 1
        
        # Setup environment
        setup_environment()
        
        # Create directories
        create_directories()
        
        # Run application
        if run_application():
            print("✅ Application stopped successfully")
            return 0
        else:
            return 1
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 