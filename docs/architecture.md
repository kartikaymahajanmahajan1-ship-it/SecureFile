# Architecture

This project uses a simple decoupled architecture suitable for beginners.

## Frontend (Next.js)
The frontend is a single-page React application built with Next.js. It runs in the user's browser. It handles file selection, password input, and UI state (like progress/errors).

## Backend (FastAPI)
The backend is a Python server. It exposes two main API endpoints: `/encrypt` and `/decrypt`.

## Data Flow
1. **User** interacts with the **Frontend**.
2. **Frontend** sends an HTTP POST request to the **Backend** containing the file and the password.
3. **Backend** processes the file in memory.
4. **Backend** uses the **Encryption Service** (`crypto.py`) to encrypt or decrypt the data.
5. **Backend** sends the resulting file back to the **Frontend** as a downloadable stream.
6. **Frontend** triggers a download prompt in the browser.

There is no database. All file processing happens in memory, and the backend never saves your files or your password to disk.
