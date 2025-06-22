# Mail Tracker

## Project Overview
Mail Tracker is a web application built with Flask that allows users to track the status of emails. It provides endpoints for storing email information, tracking when an email is opened, and generating reports in CSV format. The application also features a simple dashboard for visualizing the tracked emails.

## Installation
To set up the Mail Tracker project, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amardeep1306/mail-tracker.git
   cd mail-tracker
   ```

2. **Set up a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Usage
1. **Start the Flask server:**
   ```bash
   python server.py
   ```
   The application will run on `https://mail-tracker-production-7e26.up.railway.app`.

2. **Test the application:**
   - Open the `test.html` file in a web browser to send a test email and track its opening status.
   - You can interact with the endpoints using tools like Postman, cURL, or directly from the HTML interface.

### API Endpoints

- **Store Email:**
  ```
  POST /store
  Request body: { "subject": "<subject>", "to": "<email>", "content": "<content>", "id": "<mail_id>" }
  ```
  
- **Track Email:**
  ```
  GET /track?id=<mail_id>
  ```

- **Create Mail Entry:**
  ```
  GET /create_mail?id=<mail_id>&email=<user_email>
  ```

- **Download Report:**
  ```
  GET /download_report
  ```

- **Dashboard:**
  ```
  GET /dashboard
  ```

## Features
- Store email metadata for tracking purposes.
- Track whether an email has been opened using a tracking pixel.
- Generate downloadable reports in CSV format.
- A simple dashboard to view tracked emails.

## Dependencies
The project uses the following dependencies, as defined in the `requirements.txt` (derived from the project files):

- `Flask`: A lightweight WSGI web application framework.
- `Flask-SQLAlchemy`: An extension that adds SQLAlchemy support to Flask applications.
- `Flask-CORS`: A Flask extension for handling Cross-Origin Resource Sharing (CORS).

## Project Structure
```
mail-tracker/
├── server.py            # The main application file
├── test.html            # HTML file to test email sending and tracking
├── requirements.txt     # Dependencies for the project
```

## License
This project is licensed under the MIT License. See the LICENSE file for more information. 

## Author
- [Amardeep Kumar](https://github.com/amardeep1306)

--- 

Feel free to customize sections such as the installation commands and author information to match your specific setup and preferences.