from flask import Flask  # type: ignore[import-not-found]

app = Flask(__name__)

@app.route('/health')
def health():
    return {'status': 'ok', 'app': 'Tulenkki'}
