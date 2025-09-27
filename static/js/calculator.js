// Calculator functionality
class TaxiCalculator {
    constructor() {
        this.selectedFromCity = null;
        this.selectedToCity = null;
        this.isCalculating = false;
        this.debounceTimeout = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const calculatorForm = document.getElementById('calculatorForm');
        const fromCityInput = document.getElementById('fromCity');
        const toCityInput = document.getElementById('toCity');

        if (calculatorForm) {
            calculatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateRoute();
            });
        }

        if (fromCityInput) {
            fromCityInput.addEventListener('input', (e) => {
                this.handleCityInput(e.target, 'from');
            });
            
            fromCityInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSuggestions('fromSuggestions');
                }, 200);
            });
        }

        if (toCityInput) {
            toCityInput.addEventListener('input', (e) => {
                this.handleCityInput(e.target, 'to');
            });
            
            toCityInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSuggestions('toSuggestions');
                }, 200);
            });
        }
    }

    handleCityInput(input, type) {
        const query = input.value.trim();
        const suggestionsId = type === 'from' ? 'fromSuggestions' : 'toSuggestions';

        // Clear previous timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        if (query.length < 2) {
            this.hideSuggestions(suggestionsId);
            return;
        }

        // Debounce API calls
        this.debounceTimeout = setTimeout(() => {
            this.getSuggestions(query, suggestionsId, type);
        }, 300);
    }

    async getSuggestions(query, suggestionsId, type) {
        try {
            const response = await fetch('/api/suggest-cities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: query })
            });

            const data = await response.json();

            if (response.ok && data.suggestions) {
                this.displaySuggestions(data.suggestions, suggestionsId, type);
            } else {
                console.error('Error fetching suggestions:', data.error);
                this.hideSuggestions(suggestionsId);
            }
        } catch (error) {
            console.error('Network error:', error);
            this.hideSuggestions(suggestionsId);
        }
    }

    displaySuggestions(suggestions, suggestionsId, type) {
        const suggestionsContainer = document.getElementById(suggestionsId);
        
        if (!suggestionsContainer) return;

        if (suggestions.length === 0) {
            this.hideSuggestions(suggestionsId);
            return;
        }

        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion.display_name;
            
            suggestionItem.addEventListener('click', () => {
                this.selectCity(suggestion, type);
                this.hideSuggestions(suggestionsId);
                
                // Track city selection
                if (typeof ym !== 'undefined') {
                    ym(103671945, 'reachGoal', 'city_selected', {
                        city: suggestion.display_name,
                        type: type
                    });
                }
            });
            
            suggestionsContainer.appendChild(suggestionItem);
        });

        suggestionsContainer.style.display = 'block';
    }

    selectCity(city, type) {
        const inputId = type === 'from' ? 'fromCity' : 'toCity';
        const input = document.getElementById(inputId);
        
        if (input) {
            input.value = city.display_name;
        }

        if (type === 'from') {
            this.selectedFromCity = city;
        } else {
            this.selectedToCity = city;
        }

        // Update booking form cities
        const fromBooking = document.getElementById('fromCityBooking');
        const toBooking = document.getElementById('toCityBooking');
        
        if (type === 'from' && fromBooking) {
            fromBooking.value = city.display_name;
        }
        if (type === 'to' && toBooking) {
            toBooking.value = city.display_name;
        }

        // Auto-calculate if both cities are selected
        if (this.selectedFromCity && this.selectedToCity) {
            setTimeout(() => {
                this.calculateRoute();
            }, 500);
        }
    }

    hideSuggestions(suggestionsId) {
        const suggestionsContainer = document.getElementById(suggestionsId);
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    async calculateRoute() {
        if (this.isCalculating) return;

        const fromCityInput = document.getElementById('fromCity');
        const toCityInput = document.getElementById('toCity');
        
        if (!fromCityInput?.value.trim() || !toCityInput?.value.trim()) {
            this.showError('Пожалуйста, выберите города отправления и назначения');
            return;
        }

        if (!this.selectedFromCity || !this.selectedToCity) {
            this.showError('Пожалуйста, выберите города из предложенного списка');
            return;
        }

        this.isCalculating = true;
        this.setLoadingState(true);
        this.hideResults();
        this.hideError();

        try {
            const response = await fetch('/api/calculate-distance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from_city: this.selectedFromCity,
                    to_city: this.selectedToCity
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.displayResults(data);
                showNotification('Расчет выполнен успешно!', 'success');
                
                // Track successful calculation
                if (typeof ym !== 'undefined') {
                    ym(103671945, 'reachGoal', 'calculation_success', {
                        from_city: data.from_city,
                        to_city: data.to_city,
                        distance: data.distance_km
                    });
                }
            } else {
                this.showError(data.error || 'Ошибка при расчете маршрута');
                
                // Track calculation error
                if (typeof ym !== 'undefined') {
                    ym(103671945, 'reachGoal', 'calculation_error');
                }
            }
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Ошибка сети. Пожалуйста, проверьте подключение к интернету');
            
            // Track network error
            if (typeof ym !== 'undefined') {
                ym(103671945, 'reachGoal', 'network_error');
            }
        } finally {
            this.isCalculating = false;
            this.setLoadingState(false);
        }
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('calculatorResults');
        const distanceResult = document.getElementById('distanceResult');
        const timeResult = document.getElementById('timeResult');
        const pricingCards = document.getElementById('pricingCards');

        if (!resultsContainer || !distanceResult || !timeResult || !pricingCards) {
            console.error('Results elements not found');
            return;
        }

        // Update distance and time
        distanceResult.textContent = data.distance_km;
        timeResult.textContent = data.time_hours;

        // Create pricing cards in correct order
        pricingCards.innerHTML = '';
        
        // Define the correct order
        const tierOrder = ['economy', 'comfort', 'business', 'premium'];
        
        tierOrder.forEach(tierKey => {
            if (data.prices[tierKey]) {
                const tierData = data.prices[tierKey];
                const cardCol = document.createElement('div');
                cardCol.className = 'col-lg-3 col-md-6 mb-3';
                
                cardCol.innerHTML = `
                    <div class="pricing-card">
                        <h5>${tierData.name}</h5>
                        <div class="price">${tierData.price.toLocaleString()} ₽</div>
                        <p class="description">${tierData.description}</p>
                    </div>
                `;
                
                pricingCards.appendChild(cardCol);
            }
        });

        // Show results with animation
        resultsContainer.classList.remove('d-none');
        resultsContainer.classList.add('fade-in');

        // Scroll to results
        setTimeout(() => {
            resultsContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 300);
    }

    setLoadingState(loading) {
        const submitButton = document.querySelector('#calculatorForm button[type="submit"]');
        const btnText = submitButton?.querySelector('.btn-text');
        const btnLoading = submitButton?.querySelector('.btn-loading');

        if (submitButton && btnText && btnLoading) {
            if (loading) {
                submitButton.disabled = true;
                btnText.classList.add('d-none');
                btnLoading.classList.remove('d-none');
                submitButton.classList.add('loading');
            } else {
                submitButton.disabled = false;
                btnText.classList.remove('d-none');
                btnLoading.classList.add('d-none');
                submitButton.classList.remove('loading');
            }
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('calculatorError');
        const errorMessage = document.getElementById('errorMessage');

        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.classList.remove('d-none');
            
            // Scroll to error
            setTimeout(() => {
                errorContainer.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        }

        showNotification(message, 'danger');
    }

    hideError() {
        const errorContainer = document.getElementById('calculatorError');
        if (errorContainer) {
            errorContainer.classList.add('d-none');
        }
    }

    hideResults() {
        const resultsContainer = document.getElementById('calculatorResults');
        if (resultsContainer) {
            resultsContainer.classList.add('d-none');
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calculatorForm')) {
        window.taxiCalculator = new TaxiCalculator();
        console.log('🧮 Калькулятор такси инициализирован');
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaxiCalculator;
}