from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import app.crypto as crypto
import app.models as models
import app.auth as auth
from app.database import engine, get_db
import io
import secrets
import datetime
from pydantic import BaseModel, EmailStr

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SecureFile API", description="Simple File Encryption API")

# Allow Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Filename"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Helper function to get current user securely
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except auth.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- AUTHENTICATION ROUTES ---

@app.post("/register")
def register(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(password)
    new_user = models.User(email=email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- PASSWORD RESET ROUTES ---

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    # Invalidate any existing tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False
    ).update({"used": True})

    # Create a new reset token (expires in 1 hour)
    token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at
    )
    db.add(reset_token)
    db.commit()

    # In production, send this via email. For now, return it in the response.
    # TODO: Integrate with an email provider (SendGrid, SES, etc.)
    reset_link = f"{token}"
    return {
        "message": "If that email exists, a reset link has been sent.",
        "reset_token": token  # Remove this in production — send via email only!
    }

@app.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == request.token,
        models.PasswordResetToken.used == False
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if datetime.datetime.utcnow() > reset_token.expires_at:
        reset_token.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    # Update the user's password
    user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.password_hash = auth.get_password_hash(request.new_password)
    reset_token.used = True
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}

# --- ENCRYPTION ROUTES ---

@app.post("/encrypt")
async def encrypt_endpoint(
    file: UploadFile = File(...), 
    password: str = Form(...),
    custom_filename: str = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    status = "FAILED"
    original_filename = file.filename or "file"
    try:
        file_data = await file.read()
        encrypted_data = crypto.encrypt_file_data(file_data, password)
        
        if custom_filename and custom_filename.strip():
            base_name = custom_filename.strip()
            new_filename = base_name if base_name.endswith(".enc") else f"{base_name}.enc"
        else:
            new_filename = f"{original_filename}.enc"
        
        status = "SUCCESS"
        return StreamingResponse(
            io.BytesIO(encrypted_data),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{new_filename}"',
                "X-Filename": new_filename,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Encryption failed. Please try again.")
    finally:
        # Save history
        history = models.FileHistory(
            user_id=current_user.id,
            file_name=original_filename,
            operation="ENCRYPT",
            status=status
        )
        db.add(history)
        db.commit()

@app.post("/decrypt")
async def decrypt_endpoint(
    file: UploadFile = File(...), 
    password: str = Form(...),
    custom_filename: str = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    status = "FAILED"
    original_filename = file.filename or "file.enc"
    try:
        file_data = await file.read()
        decrypted_data = crypto.decrypt_file_data(file_data, password)
        
        if custom_filename and custom_filename.strip():
            new_filename = custom_filename.strip()
        else:
            # Strip .enc to restore the original filename
            if original_filename.endswith(".enc"):
                new_filename = original_filename[:-4]
            else:
                new_filename = f"decrypted_{original_filename}"
        
        status = "SUCCESS"
        return StreamingResponse(
            io.BytesIO(decrypted_data),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f'attachment; filename="{new_filename}"',
                "X-Filename": new_filename,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Decryption failed. Please check your password or file.")
    finally:
        # Save history
        history = models.FileHistory(
            user_id=current_user.id,
            file_name=original_filename,
            operation="DECRYPT",
            status=status
        )
        db.add(history)
        db.commit()

@app.get("/history")
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get user's history ordered by newest first
    history = db.query(models.FileHistory).filter(models.FileHistory.user_id == current_user.id).order_by(models.FileHistory.created_at.desc()).all()
    return history
