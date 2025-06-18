from flask import Flask, request, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)

class TrackedMail(db.Model):
    id = db.Column(db.String(200), primary_key=True)
    user_email = db.Column(db.String(200))
    opened_at = db.Column(db.String(200))

# Just create tables here directly
with app.app_context():
    db.create_all()

@app.route('/track')
def track():
    mail_id = request.args.get('id')
    entry = TrackedMail.query.get(mail_id)
    if entry and not entry.opened_at:
        entry.opened_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        db.session.commit()
    return '', 204

@app.route('/create_mail')
def create_mail():
    mail_id = request.args.get('id')
    user_email = request.args.get('email')
    print(f"🟡 Saving Mail: ID={mail_id}, Email={user_email}")
    if not mail_id or not user_email:
        return "Missing data", 400
    new_entry = TrackedMail(id=mail_id, user_email=user_email)
    db.session.add(new_entry)
    db.session.commit()
    
    return 'Mail Registered'

@app.route('/dashboard')
def dashboard():
    mails = TrackedMail.query.all()
    return render_template('dashboard.html', mails=mails)

if __name__ == '__main__':
    app.run(debug=True)
