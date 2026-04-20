#!/usr/bin/env python3
"""Fix admin login issue"""
import os
import sys
sys.path.insert(0, '/Users/bsurmeli/.openclaw/workspace/agent-resources/api')

from sqlmodel import create_engine, Session, select
from models import AdminUser, User
from passlib.context import CryptContext
from uuid import uuid4
from datetime import datetime

# Get DB URL from Railway
import subprocess
result = subprocess.run(['railway', 'variables'], capture_output=True, text=True, cwd='/Users/bsurmeli/.openclaw/workspace/agent-resources')
print("Railway variables output:")
print(result.stdout)
print(result.stderr)
