# Beginner's Learning Guide

Welcome! If this is your first full-stack application, this guide will break down the magic behind how **SecureFile** works. We will explain the core technologies and the specific features we built, in simple terms.

---

## 1. The Frontend (React & Next.js)

**What is it?**
- **React** is a JavaScript library for building user interfaces. 
- **Next.js** is a framework that makes building React apps easier by handling routing and configuration for you.

**How we used it in SecureFile (`page.tsx`):**
- **State (`useState`)**: In React, variables that change what the user sees are called "State". For example, `const [password, setPassword] = useState("")`. When you type in the password box, `setPassword` updates the memory, and React instantly redraws the screen with the new letters.
- **Drag and Drop**: We added standard browser events like `onDragOver` and `onDrop` to our box. When you drop a file, the browser triggers the `onDrop` event, hands us the file data, and we save it into our React state.
- **File Downloads**: When the backend sends the encrypted file back to the browser, we use a clever JavaScript trick. We create a temporary, invisible HTML link (`<a>`), point it to the file data, programmatically "click" it to trigger the browser's download window, and then instantly destroy the link.

---

## 2. Styling (Tailwind CSS)

**What is it?** 
A utility-first CSS framework. Instead of writing separate CSS files, you style things by adding pre-defined class names directly into your HTML/React code.

**How we used it:**
Look at our Encrypt button: `className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"`
- `bg-blue-600`: Sets a specific shade of blue background.
- `hover:bg-blue-700`: Makes it slightly darker when you hover your mouse over it.
- `text-white`: Makes the text white.
- `rounded-md`: Gives the button smooth, rounded corners.

---

## 3. The Backend (Python & FastAPI)

**What is it?**
**FastAPI** is a very fast, modern Python framework used to build APIs (Application Programming Interfaces). An API is just a set of rules that lets two programs talk to each other.

**How we used it (`main.py`):**
- **Endpoints**: We created routes using `@app.post("/encrypt")`. This is essentially a listener. It tells the Python server: *"Whenever you receive a POST request at the URL `/encrypt`, run the Python code directly underneath this."*
- **CORS (Cross-Origin Resource Sharing)**: By default, web browsers block websites from secretly talking to different servers. Because our Next.js frontend runs on `localhost:3000` and our FastAPI backend runs on `localhost:8000`, the browser considers them "different servers". We added `CORSMiddleware` to our backend to explicitly tell the browser: *"It is completely safe for the frontend to talk to me!"*

---

## 4. Cryptography (`crypto.py`)

**What is it?**
The mathematics that actually protect your data. We used Python's official `cryptography` library.

**How we used it:**
- **Key Derivation (PBKDF2)**: Humans like passwords like `"mysecret123"`. Encryption algorithms hate human passwords because they are too short and predictable. PBKDF2 takes your password, mixes it with 32 bytes of random data (called "Salt"), and mathematically hashes it 100,000 times. This turns your weak password into a completely random, perfectly secure 32-byte Encryption Key.
- **AES-256-GCM**: This is the industry standard for encrypting data. We use the key we just generated to scramble the file. 
- **Authentication Tag (GCM)**: GCM doesn't just encrypt data; it signs it. It adds an "Authentication Tag" to the file. If a hacker tries to modify even a single byte of your `.enc` file to mess with you, the math equation breaks, the Authentication Tag fails to match, and our backend safely refuses to decrypt it.

---

## 5. Custom Features We Built

**Password Generator**
Computers are much better at making passwords than humans. When you click "Generate Password", JavaScript loops 16 times, picking a random letter, number, or symbol from a list. We then use `navigator.clipboard.writeText()` to automatically copy it to your Mac's clipboard.

**Rename / Custom Filenames**
Usually, downloading a file is entirely up to the browser. However, we want to hide the original filename. So, the frontend sends your custom name to the backend. The backend processes the file and attaches a custom HTTP Header called `X-Filename`. When the browser receives the file, the frontend JavaScript reads that specific header and forces the browser to save the file under your new secret name!
