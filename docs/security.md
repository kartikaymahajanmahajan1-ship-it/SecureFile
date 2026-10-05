# Security Practices

Even though this is a beginner project, it follows standard cryptographic best practices.

## Algorithm
We use **AES-256-GCM**.
- **AES-256** is the encryption standard.
- **GCM (Galois/Counter Mode)** provides Authenticated Encryption. This means it encrypts the data AND guarantees that the data hasn't been tampered with.

## Key Derivation
We never use your plain password as the encryption key directly. 
Instead, we use **PBKDF2-HMAC-SHA256**.
We take your password, add 32 bytes of random "salt", and run it through a cryptographic hashing function 100,000 times to derive a secure 32-byte key.

## Encrypted File Format
The resulting `.enc` file contains:
- 32 bytes of random Salt
- 12 bytes of random Nonce (Initialization Vector)
- 16 bytes of Authentication Tag
- The actual encrypted Ciphertext

## What happens if I type the wrong password?
If you type the wrong password, PBKDF2 generates the *wrong* key. When AES-GCM tries to decrypt the file with the wrong key, the Authentication Tag validation fails, and it safely throws an error.

## Privacy
- The Python backend never logs or stores your password.
- The Python backend never stores your unencrypted files.
