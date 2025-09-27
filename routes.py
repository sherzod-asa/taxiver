import os
import requests
import logging
from datetime import datetime
from collections import OrderedDict
from flask import render_template, request, jsonify
from app import app

# API configuration
GRAPHHOPPER_API_KEY = os.getenv("GRAPHHOPPER_API_KEY", "")
DADATA_API_KEY = os.getenv("DADATA_API_KEY", "")
DADATA_SECRET_KEY = os.getenv("DADATA_SECRET_KEY", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Pricing configuration (rubles per km) - ordered by price
PRICING_TIERS = OrderedDict([
    ('economy', {
        'name': 'Эконом', 
        'price_per_km': 30, 
        'description': 'Комфортная поездка по доступной цене',
        'image_name': 'economy'
    }),
    ('comfort', {
        'name': 'Комфорт', 
        'price_per_km': 45, 
        'description': 'Повышенный комфорт и качество',
        'image_name': 'comfort'
    }),
    ('business', {
        'name': 'Бизнес', 
        'price_per_km': 60, 
        'description': 'Премиальный сервис для деловых поездок',
        'image_name': 'business'
    }),
    ('premium', {
        'name': 'Премиум', 
        'price_per_km': 80, 
        'description': 'Максимальный комфорт и роскошь',
        'image_name': 'premium'
    })
])

@app.route('/')
def index():
    """Main page with hero section"""
    return render_template('index.html')

@app.route('/calculator')
def calculator():
    """Calculator page"""
    return render_template('calculator.html', pricing_tiers=PRICING_TIERS)

@app.route('/fleet')
def fleet():
    """Fleet page"""
    return render_template('fleet.html', pricing_tiers=PRICING_TIERS)

@app.route('/booking')
def booking():
    """Booking page"""
    min_date = datetime.today().strftime('%Y-%m-%d')
    return render_template('booking.html', min_date=min_date)

@app.route('/about')
def about():
    """About us page"""
    return render_template('about.html')

@app.route('/pricing')
def pricing():
    """Pricing page"""
    return render_template('pricing.html', pricing_tiers=PRICING_TIERS)

@app.route('/contacts')
def contacts():
    """Contacts page"""
    return render_template('contacts.html')

@app.route('/terms')
def terms():
    """Terms of service page"""
    return render_template('terms.html')

@app.route('/privacy')
def privacy():
    """Privacy policy page"""
    return render_template('privacy.html')

# API routes remain the same...
@app.route('/api/suggest-cities', methods=['POST'])
def suggest_cities():
    """Get city suggestions from DaData API"""
    try:
        query = request.json.get('query', '').strip()
        if len(query) < 2:
            return jsonify({'suggestions': []})

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Token {DADATA_API_KEY}',
            'X-Secret': DADATA_SECRET_KEY
        }

        data = {
            'query': query,
            'count': 10,
            'locations': [{'country': '*'}],
            'restrict_value': True
        }

        response = requests.post(
            'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
            json=data,
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            suggestions = response.json().get('suggestions', [])
            cities = []
            for suggestion in suggestions:
                data = suggestion.get('data', {})
                if data.get('city'):
                    city_name = data['city']
                    region = data.get('region', '')
                    display_name = f"{city_name}, {region}" if region else city_name
                    
                    cities.append({
                        'name': city_name,
                        'display_name': display_name,
                        'lat': data.get('geo_lat'),
                        'lon': data.get('geo_lon')
                    })
            
            return jsonify({'suggestions': cities})
        else:
            logging.error(f"DaData API error: {response.status_code}")
            return jsonify({'error': 'Ошибка получения предложений городов'}), 500

    except Exception as e:
        logging.error(f"Error in suggest_cities: {str(e)}")
        return jsonify({'error': 'Ошибка сервера'}), 500

@app.route('/api/calculate-distance', methods=['POST'])
def calculate_distance():
    """Calculate distance between two cities using GraphHopper API"""
    try:
        data = request.json
        from_city = data.get('from_city', {})
        to_city = data.get('to_city', {})

        if not from_city.get('lat') or not from_city.get('lon') or not to_city.get('lat') or not to_city.get('lon'):
            return jsonify({'error': 'Координаты городов не найдены'}), 400

        # GraphHopper Routing API
        url = 'https://graphhopper.com/api/1/route'
        params = {
            'point': [f"{from_city['lat']},{from_city['lon']}", f"{to_city['lat']},{to_city['lon']}"],
            'vehicle': 'car',
            'key': GRAPHHOPPER_API_KEY,
            'calc_points': 'false',
            'instructions': 'false'
        }

        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 200:
            route_data = response.json()
            paths = route_data.get('paths', [])
            
            if paths:
                distance_meters = paths[0].get('distance', 0)
                time_ms = paths[0].get('time', 0)
                
                distance_km = round(distance_meters / 1000, 1)
                time_hours = round(time_ms / (1000 * 60 * 60), 1)
                
                # Calculate prices for all tiers
                prices = {}
                for tier_key, tier_info in PRICING_TIERS.items():
                    prices[tier_key] = {
                        'name': tier_info['name'],
                        'price': round(distance_km * tier_info['price_per_km']),
                        'description': tier_info['description']
                    }

                return jsonify({
                    'distance_km': distance_km,
                    'time_hours': time_hours,
                    'prices': prices,
                    'from_city': from_city['name'],
                    'to_city': to_city['name']
                })
            else:
                return jsonify({'error': 'Маршрут не найден'}), 404
        else:
            error_response = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            error_message = error_response.get('message', 'Неизвестная ошибка')
            logging.error(f"GraphHopper API error: {response.status_code}, Response: {response.text}")
            
            if response.status_code == 400:
                return jsonify({'error': 'Невозможно построить маршрут между выбранными городами. Попробуйте другие города.'}), 400
            else:
                return jsonify({'error': 'Ошибка расчета маршрута. Попробуйте позже.'}), 500

    except Exception as e:
        logging.error(f"Error in calculate_distance: {str(e)}")
        return jsonify({'error': 'Ошибка сервера'}), 500

@app.route('/submit-request', methods=['POST'])
def submit_request():
    try:
        data = request.json
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip()
        from_city = data.get('from_city', '').strip()
        to_city = data.get('to_city', '').strip()
        date_str = data.get('date', '').strip()
        comments = data.get('comments', '').strip()

        # Format date
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            formatted_date = date_obj.strftime('%d.%m.%Y')
        except:
            formatted_date = date_str

        # Prepare message for Telegram
        message = (
            "📋 *Новая заявка на такси!*\n\n"
            f"*ФИО:* {full_name}\n"
            f"*Телефон:* {phone}\n"
            f"*Маршрут:* {from_city} → {to_city}\n"
            f"*Дата:* {formatted_date}\n"
        )
        
        if comments:
            message += f"*Комментарий:* {comments}\n\n"
        else:
            message += "\n"
            
        message += "Срочно свяжитесь с клиентом!"

        # Send to Telegram
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': message,
            'parse_mode': 'Markdown'
        }

        response = requests.post(url, json=payload)
        if response.status_code != 200:
            logging.error(f"Telegram API error: {response.text}")
            return jsonify({'success': False, 'message': 'Ошибка отправки уведомления'}), 500

        return jsonify({'success': True})

    except Exception as e:
        logging.error(f"Error in submit_request: {str(e)}")
        return jsonify({'success': False, 'message': 'Внутренняя ошибка сервера'}), 500

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def server_error(error):
    return render_template('index.html'), 500