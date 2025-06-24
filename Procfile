web: gunicorn --worker-class gevent --workers 4 --bind 0.0.0.0:$PORT server:app
worker: python worker.py  # If you add background tasks