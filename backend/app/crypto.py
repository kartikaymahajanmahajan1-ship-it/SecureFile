import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

# 32 bytes salt, 12 bytes nonce (standard for GCM)
SALT_SIZE = 32
NONCE_SIZE = 12

def derive_key(password: str, salt: bytes) -> bytes:
    """Derive a 32-byte AES key from a password and salt using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return kdf.derive(password.encode('utf-8'))

def encrypt_file_data(file_data: bytes, password: str) -> bytes:
    """Encrypt data using AES-256-GCM and return the formatted output.
    Format: SALT + NONCE + TAG + CIPHERTEXT
    """
    salt = os.urandom(SALT_SIZE)
    nonce = os.urandom(NONCE_SIZE)
    key = derive_key(password, salt)
    
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce), backend=default_backend())
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(file_data) + encryptor.finalize()
    
    # The output format is: salt + nonce + authentication_tag + ciphertext
    return salt + nonce + encryptor.tag + ciphertext

def decrypt_file_data(encrypted_data: bytes, password: str) -> bytes:
    """Decrypt data using AES-256-GCM."""
    if len(encrypted_data) < SALT_SIZE + NONCE_SIZE + 16:
        raise ValueError("Invalid encrypted file format.")
    
    salt = encrypted_data[:SALT_SIZE]
    nonce = encrypted_data[SALT_SIZE:SALT_SIZE+NONCE_SIZE]
    tag = encrypted_data[SALT_SIZE+NONCE_SIZE:SALT_SIZE+NONCE_SIZE+16]
    ciphertext = encrypted_data[SALT_SIZE+NONCE_SIZE+16:]
    
    key = derive_key(password, salt)
    
    cipher = Cipher(algorithms.AES(key), modes.GCM(nonce, tag), backend=default_backend())
    decryptor = cipher.decryptor()
    
    return decryptor.update(ciphertext) + decryptor.finalize()
