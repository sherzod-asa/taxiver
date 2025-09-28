
// Booking Form Functionality
class BookingForm {
    constructor() {
        this.selectedFromCity = null;
        this.selectedToCity = null;
        this.debounceTimeout = null;
        this.hasValidated = false; // Флаг для отслеживания первой валидации
        
        this.initializeEventListeners();
        this.initializeDatePicker();
        this.initializePhoneInput();
        this.hideAllValidationMessages(); // Скрываем все сообщения при загрузке
    }

    initializeEventListeners() {
        const bookingForm = document.getElementById('bookingForm');
        const fromCityInput = document.getElementById('fromCityBooking');
        const toCityInput = document.getElementById('toCityBooking');

        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.hasValidated = true; // Отмечаем, что форма была валидирована
                this.submitForm();
            });

            // Валидация при вводе (только после первой попытки отправки)
            const inputs = bookingForm.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    if (this.hasValidated) {
                        this.validateField(input.id);
                    }
                });

                input.addEventListener('blur', () => {
                    if (this.hasValidated) {
                        this.validateField(input.id);
                    }
                });
            });
        }

        if (fromCityInput) {
            fromCityInput.addEventListener('input', (e) => {
                this.handleCityInput(e.target, 'from');
                if (this.hasValidated) {
                    this.validateField('fromCityBooking');
                }
            });
            
            fromCityInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSuggestions('fromSuggestionsBooking');
                }, 200);
                if (this.hasValidated) {
                    this.validateField('fromCityBooking');
                }
            });
        }

        if (toCityInput) {
            toCityInput.addEventListener('input', (e) => {
                this.handleCityInput(e.target, 'to');
                if (this.hasValidated) {
                    this.validateField('toCityBooking');
                }
            });
            
            toCityInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSuggestions('toSuggestionsBooking');
                }, 200);
                if (this.hasValidated) {
                    this.validateField('toCityBooking');
                }
            });
        }

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.city-input-wrapper')) {
                this.hideAllSuggestions();
            }
        });
    }

    hideAllValidationMessages() {
        const feedbackElements = document.querySelectorAll('.invalid-feedback');
        feedbackElements.forEach(element => {
            element.classList.add('d-none');
        });

        const inputs = document.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.classList.remove('is-invalid');
        });
    }

    validateField(fieldId) {
        switch (fieldId) {
            case 'fullName':
                return this.validateFullName();
            case 'phone':
                return this.validatePhone();
            case 'fromCityBooking':
                return this.validateFromCity();
            case 'toCityBooking':
                return this.validateToCity();
            case 'date':
                return this.validateDate();
            default:
                return true;
        }
    }

    validateFullName() {
        const fullName = document.getElementById('fullName').value.trim();
        const isValid = fullName.length >= 2 && fullName.split(' ').length >= 2;
        
        this.setFieldValidation('fullName', isValid, 'Пожалуйста, укажите полное ФИО (имя и фамилию)');
        return isValid;
    }

    validatePhone() {
        const phone = document.getElementById('phone').value.replace(/\D/g, '');
        const isValid = phone.length >= 11 && phone.startsWith('7');
        
        this.setFieldValidation('phone', isValid, 'Пожалуйста, укажите корректный номер телефона');
        return isValid;
    }

    validateFromCity() {
        const fromCity = document.getElementById('fromCityBooking').value.trim();
        const isValid = fromCity && this.selectedFromCity;
        
        this.setFieldValidation('fromCityBooking', isValid, 'Пожалуйста, выберите город отправления из списка');
        return isValid;
    }

    validateToCity() {
        const toCity = document.getElementById('toCityBooking').value.trim();
        const isValid = toCity && this.selectedToCity;
        
        this.setFieldValidation('toCityBooking', isValid, 'Пожалуйста, выберите город назначения из списка');
        return isValid;
    }

    validateDate() {
        const date = document.getElementById('date').value;
        let isValid = false;
        
        if (date) {
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            isValid = selectedDate >= today;
        }
        
        this.setFieldValidation('date', isValid, 'Пожалуйста, выберите корректную дату поездки');
        return isValid;
    }

    setFieldValidation(fieldId, isValid, errorMessage) {
        const field = document.getElementById(fieldId);
        const feedback = field.parentElement.querySelector('.invalid-feedback');
        
        if (!isValid) {
            field.classList.add('is-invalid');
            if (feedback) {
                feedback.textContent = errorMessage;
                feedback.classList.remove('d-none');
            }
        } else {
            field.classList.remove('is-invalid');
            if (feedback) {
                feedback.classList.add('d-none');
            }
        }
    }

    initializeDatePicker() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            // Set min date to today
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            
            // Set default value to today
            if (!dateInput.value) {
                dateInput.value = today;
            }
        }
    }

    initializePhoneInput() {
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('focus', function() {
                if (!this.value.startsWith('+7')) {
                    this.value = '+7';
                }
            });

            phoneInput.addEventListener('input', function(e) {
                let value = this.value.replace(/\D/g, '');
                
                if (value.startsWith('7')) {
                    value = '+7' + value.substring(1);
                } else if (value.startsWith('8')) {
                    value = '+7' + value.substring(1);
                } else if (!value.startsWith('7')) {
                    value = '+7' + value;
                }
                
                // Format phone number
                if (value.length > 2) {
                    value = value.substring(0, 2) + ' (' + value.substring(2);
                }
                if (value.length > 7) {
                    value = value.substring(0, 7) + ') ' + value.substring(7);
                }
                if (value.length > 12) {
                    value = value.substring(0, 12) + '-' + value.substring(12);
                }
                if (value.length > 15) {
                    value = value.substring(0, 15) + '-' + value.substring(15);
                }
                if (value.length > 18) {
                    value = value.substring(0, 18);
                }
                
                this.value = value;
            });
        }
    }

    handleCityInput(input, type) {
        const query = input.value.trim();
        const suggestionsId = type === 'from' ? 'fromSuggestionsBooking' : 'toSuggestionsBooking';

        // Clear previous timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        if (query.length < 2) {
            this.hideSuggestions(suggestionsId);
            // Сбрасываем выбранный город если поле очищено
            if (type === 'from') {
                this.selectedFromCity = null;
            } else {
                this.selectedToCity = null;
            }
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
                
                // Валидируем поле после выбора города
                if (this.hasValidated) {
                    if (type === 'from') {
                        this.validateFromCity();
                    } else {
                        this.validateToCity();
                    }
                }
            });
            
            suggestionsContainer.appendChild(suggestionItem);
        });

        suggestionsContainer.style.display = 'block';
    }

    selectCity(city, type) {
        const inputId = type === 'from' ? 'fromCityBooking' : 'toCityBooking';
        const input = document.getElementById(inputId);
        
        if (input) {
            input.value = city.display_name;
        }

        if (type === 'from') {
            this.selectedFromCity = city;
        } else {
            this.selectedToCity = city;
        }
    }

    hideSuggestions(suggestionsId) {
        const suggestionsContainer = document.getElementById(suggestionsId);
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    hideAllSuggestions() {
        this.hideSuggestions('fromSuggestionsBooking');
        this.hideSuggestions('toSuggestionsBooking');
    }

    validateForm() {
        const isFullNameValid = this.validateFullName();
        const isPhoneValid = this.validatePhone();
        const isFromCityValid = this.validateFromCity();
        const isToCityValid = this.validateToCity();
        const isDateValid = this.validateDate();
        
        return isFullNameValid && isPhoneValid && isFromCityValid && isToCityValid && isDateValid;
    }

    async submitForm() {
        if (!this.validateForm()) {
            this.showError('Пожалуйста, исправьте ошибки в форме');
            
            // Прокрутка к первой ошибке
            const firstError = document.querySelector('.is-invalid');
            if (firstError) {
                firstError.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
            return;
        }
        
        this.setLoadingState(true);
        this.hideError();
        
        try {
            const formData = {
                full_name: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value,
                from_city: document.getElementById('fromCityBooking').value,
                to_city: document.getElementById('toCityBooking').value,
                date: document.getElementById('date').value,
                passengers: document.getElementById('passengers').value,
                comments: document.getElementById('comments').value.trim()
            };
            
            const response = await fetch('/submit-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showSuccessModal();
                document.getElementById('bookingForm').reset();
                this.selectedFromCity = null;
                this.selectedToCity = null;
                this.hasValidated = false; // Сбрасываем флаг валидации
                this.hideAllValidationMessages(); // Скрываем все сообщения об ошибках
                
                // Track successful booking
                if (typeof ym !== 'undefined') {
                    ym(103671945, 'reachGoal', 'booking_success');
                }
            } else {
                throw new Error(data.message || 'Ошибка при отправке заявки');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError(error.message || 'Ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
            
            // Track booking error
            if (typeof ym !== 'undefined') {
                ym(103671945, 'reachGoal', 'booking_error');
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const submitButton = document.querySelector('#bookingForm button[type="submit"]');
        if (!submitButton) return;
        
        const btnText = submitButton.querySelector('.btn-text');
        const btnLoading = submitButton.querySelector('.btn-loading');
        
        if (loading) {
            submitButton.disabled = true;
            if (btnText) btnText.classList.add('d-none');
            if (btnLoading) btnLoading.classList.remove('d-none');
        } else {
            submitButton.disabled = false;
            if (btnText) btnText.classList.remove('d-none');
            if (btnLoading) btnLoading.classList.add('d-none');
        }
    }

    showSuccessModal() {
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
        
        // Start countdown
        this.startCountdown(5, () => {
            modal.hide();
        });
    }

    startCountdown(seconds, callback) {
        const countdownElement = document.getElementById('countdownNumber');
        let countdown = seconds;
        
        countdownElement.textContent = countdown;
        
        const interval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 1000);
    }

    showError(message) {
        const errorContainer = document.getElementById('bookingError');
        const errorMessage = document.getElementById('bookingErrorMessage');
        
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
    }

    hideError() {
        const errorContainer = document.getElementById('bookingError');
        if (errorContainer) {
            errorContainer.classList.add('d-none');
        }
    }
}

// Initialize booking form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('bookingForm')) {
        window.bookingForm = new BookingForm();
        console.log('📋 Форма бронирования инициализирована');
    }
});