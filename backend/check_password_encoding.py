"""
Check if DATABASE_URL password needs URL encoding
"""
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, quote, unquote

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

parsed = urlparse(DATABASE_URL)
password = parsed.password

if password:
    # Check if password is already URL-encoded
    decoded = unquote(password)
    
    print("="*60)
    print("Password Encoding Check")
    print("="*60)
    print(f"Original password (from URL): {password[:10]}...")
    print(f"Decoded password: {decoded[:10]}...")
    
    # Check if password contains special characters that need encoding
    special_chars = ['@', '#', '%', '&', '+', '=', '?', '/', ':', ';']
    needs_encoding = any(char in decoded for char in special_chars)
    
    if needs_encoding:
        print("\n⚠️  WARNING: Password contains special characters!")
        print("   These characters need to be URL-encoded in the DATABASE_URL")
        print("\n   Special characters found:")
        found_chars = [char for char in special_chars if char in decoded]
        for char in found_chars:
            print(f"     '{char}' should be encoded as '{quote(char)}'")
        
        print("\n   To fix this:")
        print("   1. Get your password from Supabase dashboard")
        print("   2. URL-encode it using Python:")
        print(f"      from urllib.parse import quote")
        print(f"      encoded_password = quote('YOUR_PASSWORD')")
        print("   3. Update DATABASE_URL in .env with encoded password")
        
        # Show example
        encoded_example = quote(decoded)
        if encoded_example != password:
            print(f"\n   Example: If password is '{decoded[:20]}...'")
            print(f"   Encoded should be: '{encoded_example[:30]}...'")
            print(f"   Current URL has: '{password[:30]}...'")
            print("\n   → Your password needs to be URL-encoded!")
    else:
        print("\n✓ Password doesn't contain special characters that need encoding")
        print("  If authentication still fails, check:")
        print("  1. Password is correct in Supabase dashboard")
        print("  2. Database user is 'postgres' (not 'postgres.xxxxx')")
        print("  3. Try resetting the password in Supabase")
else:
    print("❌ No password found in DATABASE_URL")

print("\n" + "="*60)
















