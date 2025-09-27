#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx

# Create application directory
sudo mkdir -p /var/www/taxiver
sudo chown -R $USER:$USER /var/www/taxiver

# Clone or copy your application files to /var/www/taxiver

# Create virtual environment
cd /var/www/taxiver
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create systemd service
sudo tee /etc/systemd/system/taxiver.service > /dev/null <<EOF
[Unit]
Description=Taxiver Gunicorn Service
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=/var/www/taxiver
Environment="PATH=/var/www/taxiver/venv/bin"
ExecStart=/var/www/taxiver/venv/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/taxiver
sudo ln -s /etc/nginx/sites-available/taxiver /etc/nginx/sites-enabled/
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d taxiver.ru -d www.taxiver.ru

# Start services
sudo systemctl daemon-reload
sudo systemctl start taxiver
sudo systemctl enable taxiver
sudo systemctl restart nginx
