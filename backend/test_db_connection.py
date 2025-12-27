"""
Test database connection script
Run this to diagnose database connection issues
"""
import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

print(f"Testing connection to: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'hidden'}")

# Parse the connection string
parsed = urlparse(DATABASE_URL)

print("\n" + "="*60)
print("Connection Details:")
print("="*60)
print(f"Host: {parsed.hostname}")
print(f"Port: {parsed.port}")
print(f"Database: {parsed.path[1:] if parsed.path else 'postgres'}")
print(f"User: {parsed.username}")
print("="*60 + "\n")

# Test 1: DNS Resolution
print("Test 1: DNS Resolution...")
try:
    import socket
    ip_address = socket.gethostbyname(parsed.hostname)
    print(f"✓ DNS Resolution successful: {parsed.hostname} -> {ip_address}")
except socket.gaierror as e:
    print(f"✗ DNS Resolution failed: {e}")
    print("\n⚠️  Possible solutions:")
    print("   1. Check your internet connection")
    print("   2. Verify the hostname in your Supabase dashboard")
    print("   3. Try using the connection pooler (port 6543)")
    print("   4. Check if your Supabase database is paused (free tier)")
    exit(1)

# Test 2: Network Connectivity
print("\nTest 2: Network Connectivity (Port 5432)...")
try:
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(5)
    result = sock.connect_ex((parsed.hostname, parsed.port))
    sock.close()
    if result == 0:
        print(f"✓ Port {parsed.port} is reachable")
    else:
        print(f"✗ Port {parsed.port} is not reachable")
        print("\n⚠️  Possible solutions:")
        print("   1. Check firewall settings")
        print("   2. Try using the connection pooler (port 6543)")
        print("   3. Verify Supabase database is running")
except Exception as e:
    print(f"✗ Network connectivity test failed: {e}")

# Test 3: Database Connection
print("\nTest 3: Database Connection...")
try:
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port,
        database=parsed.path[1:] if parsed.path else "postgres",
        user=parsed.username,
        password=parsed.password,
        connect_timeout=10
    )
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"✓ Database connection successful!")
    print(f"  PostgreSQL version: {version[0][:50]}...")
    cursor.close()
    conn.close()
except psycopg2.OperationalError as e:
    print(f"✗ Database connection failed: {e}")
    print("\n⚠️  Possible solutions:")
    print("   1. Verify database credentials in .env file")
    print("   2. Check if Supabase database is paused (resume it in dashboard)")
    print("   3. Try using connection pooler:")
    print("      Change port from 5432 to 6543 in DATABASE_URL")
    print("   4. Check Supabase project settings for correct connection string")
    exit(1)
except Exception as e:
    print(f"✗ Unexpected error: {e}")
    exit(1)

print("\n" + "="*60)
print("✓ All tests passed! Database connection is working.")
print("="*60)

