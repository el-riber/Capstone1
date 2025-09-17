

### 📄  SymptoCare Backend (PDF Export Feature)

````
# SymptoCare Backend 🧠📊

This is the FastAPI backend for the **SymptoCare** app — an AI-powered wellness tracker.



## 🏁 Getting Started

### 1. 📦 Clone the Repo

```bash
git clone https://github.com/your-username/symptocare-capstone.git
cd symptocare-capstone/backend
````

---

### 2. 🐍 Create & Activate Virtual Environment (Windows)

```bash
python -m venv venv
.\venv\Scripts\activate
```

> On macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 3. 📦 Install Requirements

```bash
pip install -r requirements.txt
```

If you don’t have a `requirements.txt` yet, create it:

```bash
pip install fastapi uvicorn python-dotenv supabase xhtml2pdf jinja2
pip freeze > requirements.txt
```



### 4. 🚀 Run the Server

```bash
uvicorn app.main:app --reload --port 8080
```

Access it at: [http://localhost:8080/docs](http://localhost:8080/docs)


Here’s a professional `README.md` section specifically for running the **SymptoCare frontend** (Next.js with Tailwind, connected to the FastAPI backend and Supabase):

---

### 📄 `README.md` — SymptoCare Frontend (React / Next.js)

````md
# SymptoCare Frontend 💙🌤️

This is the frontend for the **SymptoCare** capstone project — a professional AI-powered wellness and mood-tracking app.


## 🏁 Getting Started

### 1. 📦 Clone the Repo

```bash
git clone https://github.com/your-username/symptocare-capstone.git
cd symptocare-capstone/frontend
````

---

### 2. 📦 Install Dependencies

```bash
npm install
```

---



### 3. 🚀 Run the Frontend Dev Server

```bash
npm run dev
```

Then open in your browser:

```
http://localhost:3000
```

---


## 🧪 Testing Connection

* Make sure your backend is running first:

  ```
  uvicorn app.main:app --reload --port 8080
  ```
* Then open:

  ```
  http://localhost:3000
  ```
* Login or Signup and navigate to:

  /home
  /login
  /dashboard
  /analytics
  /chat
  /welcome
  /safety-plan
  /journal
---

## 🧠 Notes

* You must be authenticated with Supabase to access `/protected/*` routes.
* Mood data is saved to Supabase → summarized by FastAPI → returned to frontend.
* Frontend fetches PDF from:
  `POST http://localhost:8080/insights/summary/pdf?user_id=...`

---

## 📬 Contact

For questions, please open an issue or contact the maintainer.

---
## License

This project is proprietary software.  
Copyright © 2025 Elida Ribeiro.  
All rights reserved.

Unauthorized use, reproduction, or distribution of this software or any portion of it may result in civil and/or criminal penalties.  
Please contact the author for licensing or usage inquiries.


## © 2025 SymptoCare Capstone · Built with ❤️ using FastAPI & Supabase





