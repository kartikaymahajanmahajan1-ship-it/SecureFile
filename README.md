# SecureFile (Basic Version)

A simple full-stack web application for encrypting and decrypting files securely locally.

## What this project does
SecureFile allows you to select any file from your Mac, enter a password, and download an encrypted `.enc` version of that file. You can later select that `.enc` file, enter the correct password, and get your original file back.

## Technologies Used
- **Frontend**: Next.js, React, Tailwind CSS (User Interface)
- **Backend**: FastAPI, Python (Handles API requests)
- **Cryptography**: Python's `cryptography` library (AES-256-GCM)

## Project Structure
```text
project/
├── frontend/
│   └── src/app/page.tsx   # The main User Interface
├── backend/
│   ├── app/
│   │   ├── main.py        # The FastAPI server
│   │   └── crypto.py      # The encryption logic
│   └── requirements.txt
├── docs/                  # Documentation
└── README.md
```

## How Encryption Works
When you enter a password and click Encrypt, the file goes to the Python backend. We use your password and a random "salt" to generate a secure 32-byte key. The file is then encrypted using an industry-standard algorithm called AES-256-GCM. 

## How Decryption Works
When you upload the `.enc` file and type the password, the backend reads the salt from the file, generates the key again, and decrypts the file. If the password is wrong, the decryption fails safely.

## How to Install Dependencies
1. **Backend**: 
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Frontend**:
   ```bash
   cd frontend
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   nvm use 20
   npm install
   ```

## How to Start the Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```
The API runs at `http://localhost:8000`. You can see docs at `http://localhost:8000/docs`.

## How to Start the Frontend
```bash
cd frontend
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm run dev
```
Open `http://localhost:3000` in your browser.

## How to Test
- **Encrypt**: Pick a file, type "password123", click Encrypt. Download the `.enc` file.
- **Decrypt**: Refresh page. Pick the `.enc` file, type "password123", click Decrypt. You'll get your original file!

## Common Errors
- `Failed to fetch`: Make sure the Python backend is running.
- `Decryption failed`: You entered the wrong password, or selected a non-encrypted file for decryption.
