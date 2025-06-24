# Mail Tracker

## Project Overview
This project is a custom-built Email Read Tracking System that integrates a Firefox browser extension with a Flask-based backend server. It allows users to track whether their sent emails have been opened by the recipients or not, similar to commercial tools like Mailtrack, but specifically designed for Firefox.

The system works by injecting a unique tracking pixel (1×1 transparent image) into the body of every email composed in Gmail. When the recipient opens the email and the pixel loads, the request is sent to the backend server. This triggers the server to log the event, update the email status as "read", and store relevant metadata like time, IP address, and user agent.

A web-based dashboard is also provided where users can see:

- List of tracked emails

- Subject and recipient

- Status (read/unread)

- Timestamp of when the email was sent and read

- Summary statistics like open rates and average read time

#  Firefox Email Tracker - Local Setup Guide

## Installation

This guide helps you run the **Firefox Email Tracker** project locally on any laptop. It includes backend (Flask server) + frontend (Firefox extension) setup.

---

###  Minimum Requirements

####  1. System Requirements

| Component | Requirement                        |
|-----------|------------------------------------|
| OS        | Windows, macOS, or Linux           |
| RAM       | At least 4 GB                      |
| Disk Space| Minimum 500 MB free                |
| Browser   | Firefox (latest version) installed |
| Internet  | Required only for Gmail or ngrok   |

---

### ⚙ 2. Software Dependencies

####  Backend: Flask Server

| Tool             | Version / Notes                  |
|------------------|----------------------------------|
| Python           | 3.7 or higher                    |
| pip              | Comes with Python                |
| Flask            | `pip install flask`              |
| Flask-SQLAlchemy | `pip install flask_sqlalchemy`   |
| Flask-CORS       | `pip install flask_cors`         |
| Pillow           | `pip install pillow`             |
| humanize         | `pip install humanize`           |

 **Install everything in one go:**

```bash
pip install flask flask_sqlalchemy flask_cors pillow humanize
```

##  3. Setup Steps

### 🅰️ A. Run Flask Server

1. Open **terminal** or **command prompt**.
2. Navigate to the folder where `server.py` is located.
3. Start the Flask server by running:

   ```bash
   python server.py
   ```

### 🅱️ B. Load Firefox Extension

1. Open **Firefox browser**.
2. In the address bar, go to:

Go to the following URL in your Firefox browser to load the extension:
```bash
about:debugging#/runtime/this-firefox
```

3. Click on **"Load Temporary Add-on..."**
4. Select the `manifest.json` file from your extension directory.
5. The extension icon will now appear in the Firefox toolbar.
now setup is ready go to back on first page.
6. Click the icon to:
-  **Toggle tracking ON**
-  **Enter a recipient email** (if your extension supports this feature)

 **Note:**  
You will need to **re-load the extension** every time you restart Firefox, because it is loaded **temporarily**.
now after sending email you can output of desired result after clicking dashboard tab that appear on popup
