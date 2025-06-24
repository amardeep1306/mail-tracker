import os
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
from io import BytesIO
from PIL import Image
import logging
import humanize

# --- Flask Setup ---
app = Flask(__name__, template_folder='templates')

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler("server.log"),
        logging.StreamHandler()
    ]
)

app.config.update({
    'SQLALCHEMY_DATABASE_URI': os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(os.path.dirname(__file__), 'mail_tracker.db')),
    'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    'TEMPLATES_AUTO_RELOAD': True,
    'TIMEZONE': os.getenv('TIMEZONE', 'UTC'),
    'MAX_CONTENT_LENGTH': 1 * 1024 * 1024
})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

os.makedirs(app.instance_path, exist_ok=True)

db = SQLAlchemy(app)

# --- Models ---
class TrackedMail(db.Model):
    __tablename__ = 'tracked_mails'
    id = db.Column(db.String(200), primary_key=True)
    user_email = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(200))
    content = db.Column(db.Text)
    sent_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    opened_at = db.Column(db.DateTime)
    tracking_url = db.Column(db.String(500))
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(50))
    status = db.Column(db.String(20), default='sent')

    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'subject': self.subject,
            'content': self.content,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'opened_at': self.opened_at.isoformat() if self.opened_at else None,
            'status': 'read' if self.opened_at else 'unread',
            'tracking_url': self.tracking_url,
            'user_agent': self.user_agent,
            'ip_address': self.ip_address
        }

# --- Utility Functions ---
def get_current_time():
    return datetime.now(timezone.utc)

def is_bot(user_agent):
    keywords = ['GoogleImageProxy', 'bot', 'crawler', 'spider', 'facebookexternalhit', 'Slackbot']
    return any(k.lower() in user_agent.lower() for k in keywords)

# --- Routes ---
@app.before_request
def before_request():
    if not hasattr(app, 'db_initialized'):
        with app.app_context():
            db.create_all()
        app.db_initialized = True

@app.template_filter('time_ago')
def time_ago_filter(dt):
    if not dt: return "N/A"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return humanize.naturaltime(now - dt)

@app.route('/')
@app.route('/dashboard')
def dashboard():
    mails = TrackedMail.query.order_by(TrackedMail.sent_at.desc()).all()
    return render_template('dashboard.html', mails=mails, stats=get_stats())

@app.route('/store', methods=['POST'])
def store_email():
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400

        data = request.get_json()
        required = ['subject', 'to', 'content', 'id', 'trackingUrl']
        missing = [key for key in required if key not in data]
        if missing:
            return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

        if not data['to'] or '@' not in data['to']:
            return jsonify({'error': 'Invalid recipient email'}), 400

        if len(data['content']) > 10000:
            data['content'] = data['content'][:10000] + '...'

        existing = TrackedMail.query.get(data['id'])
        if existing:
            logger.info(f"[STORE] Updating existing ID={data['id']}")
            existing.user_email = data['to']
            existing.subject = data['subject']
            existing.content = data['content']
            existing.tracking_url = data['trackingUrl']
            existing.sent_at = get_current_time()
            # Preserve opened_at if it already exists
            if not existing.opened_at:
                existing.status = 'sent'
            db.session.commit()
            return jsonify({'message': 'Email updated', 'id': existing.id}), 200


        mail = TrackedMail(
            id=data['id'],
            user_email=data['to'],
            subject=data['subject'],
            content=data['content'],
            tracking_url=data['trackingUrl'],
            sent_at=get_current_time(),
            status='sent'
        )
        db.session.add(mail)
        db.session.commit()
        return jsonify({'message': 'Email stored successfully', 'id': mail.id}), 200
    except Exception as e:
        logger.error(f"[STORE ERROR] {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to store email'}), 500

@app.route('/track')
def track():
    try:
        mail_id = request.args.get('id')
        if not mail_id:
            return '', 400

        user_agent = request.headers.get('User-Agent', '')
        ip = request.remote_addr or 'Unknown'

        if is_bot(user_agent):
            logger.info(f"[TRACK IGNORED] Bot: {user_agent}")
            return '', 204

        entry = TrackedMail.query.get(mail_id)
        now = get_current_time()

        if entry:
            if not entry.opened_at:
               
                entry.opened_at = now
                entry.user_agent = user_agent
                entry.ip_address = ip
                entry.status = 'read'
                db.session.commit()
                logger.info(f"[TRACK] Marked as read: {mail_id}")
        else:
            logger.warning(f"[TRACK EARLY] Mail not found yet: {mail_id}, creating shell entry")
            # Check again if it was inserted by another thread (race condition)
            existing = TrackedMail.query.get(mail_id)
            if not existing:
                # only add if it doesn't already exist
                entry = TrackedMail(
                    id=mail_id,
                    user_email='unknown@example.com',
                    subject='Unknown',
                    content='Pixel hit before email stored',
                    tracking_url=request.url,
                    sent_at=now,
                    opened_at=now,
                    user_agent=user_agent,
                    ip_address=ip,
                    status='read'
                )
                db.session.add(entry)
                db.session.commit()
                logger.info(f"[TRACK INSERT] Early entry created: {mail_id}")

        # Return 1x1 transparent PNG
        img = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
        buffer = BytesIO()
        img.save(buffer, 'PNG')
        buffer.seek(0)
        return buffer.getvalue(), 200, {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }

    except Exception as e:
        logger.exception(f"[TRACK ERROR] {e}")
        db.session.rollback()
        return '', 500


@app.route('/api/mails')
def list_mails():
    try:
        mails = TrackedMail.query.order_by(TrackedMail.sent_at.desc()).all()
        return jsonify([m.to_dict() for m in mails])
    except Exception as e:
        logger.error(f"[API ERROR] {e}")
        return jsonify({'error': 'Failed to list mails'}), 500

@app.route('/api/mails/<mail_id>')
def get_mail(mail_id):
    try:
        mail = TrackedMail.query.get(mail_id)
        if not mail:
            return jsonify({'error': 'Mail not found'}), 404
        return jsonify(mail.to_dict())
    except Exception as e:
        logger.error(f"[GET MAIL ERROR] {e}")
        return jsonify({'error': 'Error retrieving mail'}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/debug')
def debug():
    return jsonify({
        'total': TrackedMail.query.count(),
        'recent': [m.to_dict() for m in TrackedMail.query.order_by(TrackedMail.sent_at.desc()).limit(5)]
    })

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'Internal server error'}), 500

def get_stats():
    total = TrackedMail.query.count()
    read = TrackedMail.query.filter(TrackedMail.opened_at.isnot(None)).count()
    unread = total - read

    avg_open_time = "N/A"
    if read > 0:
        avg_seconds = db.session.query(
            db.func.avg(
                db.func.strftime('%s', TrackedMail.opened_at) -
                db.func.strftime('%s', TrackedMail.sent_at)
            )
        ).filter(TrackedMail.opened_at.isnot(None)).scalar()
        if avg_seconds:
            avg_open_time = humanize.naturaldelta(timedelta(seconds=avg_seconds))

    return {
        'total_emails': total,
        'read_emails': read,
        'unread_emails': unread,
        'read_percentage': round((read / total) * 100, 1) if total > 0 else 0,
        'unread_percentage': round((unread / total) * 100, 1) if total > 0 else 0,
        'avg_open_time': avg_open_time
    }

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
