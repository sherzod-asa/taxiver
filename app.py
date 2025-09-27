import os
import logging
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SESSION_SECRET", "dev-secret-key-for-testing")

# Add sitemap and robots handlers
@app.route('/sitemap.xml', endpoint='sitemap_xml')
def sitemap():
    return send_from_directory('static', 'sitemap.xml')

@app.route('/robots.txt', endpoint='robots_txt')
def robots():
    return send_from_directory('static', 'robots.txt')

# Add manifest for PWA
@app.route('/site.webmanifest', endpoint='webmanifest_app')
def webmanifest():
    return send_from_directory('static', 'site.webmanifest')

# Service Worker
@app.route('/sw.js', endpoint='service_worker_js')
def service_worker():
    return send_from_directory('static', 'sw.js')

# Favicon
@app.route('/favicon.ico', endpoint='favicon_ico')
def favicon():
    return send_from_directory('static', 'img/favicon.ico')

# SEO: Add canonical URL middleware
@app.context_processor
def inject_canonical():
    from flask import request
    return dict(canonical_url="https://taxiver.ru" + request.path)

# Import routes
from routes import *

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)