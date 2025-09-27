#!/bin/bash
cd /var/www/taxiver
source venv/bin/activate
pip freeze > requirements.txt
