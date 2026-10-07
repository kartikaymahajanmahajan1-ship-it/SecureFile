from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class FileHistory(Base):
    __tablename__ = "file_operations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    file_name = Column(String)
    operation = Column(String) # ENCRYPT or DECRYPT
    status = Column(String)    # SUCCESS or FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    token = Column(String, unique=True, index=True)
    used = Column(Boolean, default=False)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
