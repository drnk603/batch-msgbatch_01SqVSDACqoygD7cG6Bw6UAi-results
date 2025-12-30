(function() {
    'use strict';

    const CONFIG = {
        headerHeight: 80,
        animationDuration: 600,
        animationOffset: 120,
        debounceDelay: 250,
        throttleDelay: 100
    };

    const VALIDATORS = {
        name: /^[a-zA-ZÀ-ÿs-']{2,50}$/,
        email: /^[^s@]+@[^s@]+.[^s@]+$/,
        phone: /^[ds+-()]{10,20}$/,
        message: /^.{10,}$/
    };

    const ERROR_MESSAGES = {
        firstName: 'Bitte geben Sie einen gültigen Vornamen ein (2-50 Zeichen)',
        lastName: 'Bitte geben Sie einen gültigen Nachnamen ein (2-50 Zeichen)',
        email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        phone: 'Bitte geben Sie eine gültige Telefonnummer ein (10-20 Zeichen)',
        message: 'Die Nachricht muss mindestens 10 Zeichen enthalten',
        privacy: 'Sie müssen die Datenschutzerklärung akzeptieren',
        required: 'Dieses Feld ist erforderlich'
    };

    function debounce(func, wait) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    class NotificationManager {
        constructor() {
            this.container = this.createContainer();
        }

        createContainer() {
            const container = document.createElement('div');
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
            return container;
        }

        show(message, type = 'info') {
            const alertClass = type === 'error' ? 'alert-danger' : `alert-${type}`;
            const alert = document.createElement('div');
            alert.className = `alert ${alertClass} alert-dismissible fade show`;
            alert.style.minWidth = '300px';
            alert.style.animation = 'slideInRight 0.3s ease-out';
            alert.innerHTML = `
                ${sanitizeInput(message)}
                <button type="button" class="btn-close" aria-label="Schließen"></button>
            `;

            const closeBtn = alert.querySelector('.btn-close');
            closeBtn.addEventListener('click', () => this.hide(alert));

            this.container.appendChild(alert);

            setTimeout(() => this.hide(alert), 5000);
        }

        hide(alert) {
            alert.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => alert.remove(), 300);
        }
    }

    class BurgerMenu {
        constructor() {
            this.nav = document.querySelector('.navbar');
            this.toggle = document.querySelector('.navbar-toggler');
            this.collapse = document.querySelector('.navbar-collapse');
            this.body = document.body;
            this.isOpen = false;

            if (this.toggle && this.collapse) {
                this.init();
            }
        }

        init() {
            this.toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });

            this.collapse.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (this.isOpen) this.closeMenu();
                });
            });

            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.nav.contains(e.target)) {
                    this.closeMenu();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });

            window.addEventListener('resize', debounce(() => {
                if (window.innerWidth >= 768 && this.isOpen) {
                    this.closeMenu();
                }
            }, CONFIG.debounceDelay));
        }

        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        }

        openMenu() {
            this.isOpen = true;
            this.collapse.classList.add('show');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.body.classList.add('menu-open');
            this.collapse.style.height = `calc(100vh - ${CONFIG.headerHeight}px)`;
        }

        closeMenu() {
            this.isOpen = false;
            this.collapse.classList.remove('show');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.body.classList.remove('menu-open');
            this.collapse.style.height = '';
        }
    }

    class FormValidator {
        constructor(form, notificationManager) {
            this.form = form;
            this.notify = notificationManager;
            this.isSubmitting = false;
            this.init();
        }

        init() {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            this.form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearFieldError(field));
            });
        }

        handleSubmit(e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.isSubmitting) return;

            this.clearAllErrors();

            const isValid = this.validateForm();

            if (!isValid) {
                this.notify.show('Bitte korrigieren Sie die markierten Fehler', 'error');
                return;
            }

            this.submitForm();
        }

        validateForm() {
            let isValid = true;
            const fields = this.form.querySelectorAll('input, textarea, select');

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        validateField(field) {
            const fieldId = field.id;
            const value = field.value.trim();
            const isRequired = field.hasAttribute('required');

            if (isRequired && !value) {
                this.showFieldError(field, ERROR_MESSAGES.required);
                return false;
            }

            if (!value && !isRequired) {
                return true;
            }

            if (fieldId === 'firstName' || fieldId === 'lastName') {
                if (!VALIDATORS.name.test(value)) {
                    this.showFieldError(field, ERROR_MESSAGES[fieldId]);
                    return false;
                }
            }

            if (fieldId === 'email' && value) {
                if (!VALIDATORS.email.test(value)) {
                    this.showFieldError(field, ERROR_MESSAGES.email);
                    return false;
                }
            }

            if (fieldId === 'phone' && value) {
                if (!VALIDATORS.phone.test(value)) {
                    this.showFieldError(field, ERROR_MESSAGES.phone);
                    return false;
                }
            }

            if (fieldId === 'message' && value) {
                if (!VALIDATORS.message.test(value)) {
                    this.showFieldError(field, ERROR_MESSAGES.message);
                    return false;
                }
            }

            if (field.type === 'checkbox' && isRequired && !field.checked) {
                this.showFieldError(field, ERROR_MESSAGES.privacy);
                return false;
            }

            this.clearFieldError(field);
            return true;
        }

        showFieldError(field, message) {
            field.classList.add('is-invalid');
            
            let feedback = field.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                field.parentElement.appendChild(feedback);
            }
            
            feedback.textContent = message;
            feedback.style.display = 'block';
        }

        clearFieldError(field) {
            field.classList.remove('is-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.style.display = 'none';
            }
        }

        clearAllErrors() {
            this.form.querySelectorAll('.is-invalid').forEach(field => {
                this.clearFieldError(field);
            });
        }

        async submitForm() {
            this.isSubmitting = true;
            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Wird gesendet...';

            const formData = new FormData(this.form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = sanitizeInput(value);
            });

            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                this.notify.show('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', 'success');
                
                setTimeout(() => {
                    window.location.href = 'thank_you.html';
                }, 1000);

            } catch (error) {
                this.notify.show('Es gab einen Fehler beim Senden. Bitte versuchen Sie es später erneut.', 'error');
            } finally {
                this.isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    }

    class ScrollAnimations {
        constructor() {
            this.observer = null;
            this.init();
        }

        init() {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                }
            );

            this.observeElements();
        }

        observeElements() {
            const elements = document.querySelectorAll('.card, .c-card, img, .hero-section > *, form, .l-section > .container > *');
            
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = `all ${CONFIG.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
                el.style.transitionDelay = `${index * 50}ms`;
                this.observer.observe(el);
            });
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    this.observer.unobserve(entry.target);
                }
            });
        }
    }

    class ButtonAnimations {
        constructor() {
            this.init();
        }

        init() {
            const buttons = document.querySelectorAll('.btn, .c-button, a[class*="btn"]');
            
            buttons.forEach(btn => {
                btn.addEventListener('mouseenter', (e) => this.handleHover(e));
                btn.addEventListener('mouseleave', (e) => this.handleLeave(e));
                btn.addEventListener('click', (e) => this.handleClick(e));
            });
        }

        handleHover(e) {
            const btn = e.currentTarget;
            btn.style.transform = 'translateY(-2px) scale(1.02)';
        }

        handleLeave(e) {
            const btn = e.currentTarget;
            btn.style.transform = 'translateY(0) scale(1)';
        }

        handleClick(e) {
            const btn = e.currentTarget;
            const ripple = document.createElement('span');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 600ms ease-out';
            ripple.style.pointerEvents = 'none';

            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        }
    }

    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;

                const href = link.getAttribute('href');
                if (href === '#' || href === '#!') return;

                const targetId = href.substring(1);
                const target = document.getElementById(targetId);
                if (!target) return;

                e.preventDefault();

                const header = document.querySelector('.l-header');
                const offset = header ? header.offsetHeight : CONFIG.headerHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            });
        }
    }

    class ScrollSpy {
        constructor() {
            this.sections = [];
            this.links = [];
            this.init();
        }

        init() {
            this.sections = Array.from(document.querySelectorAll('section[id]'));
            this.links = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));

            if (this.sections.length === 0) return;

            window.addEventListener('scroll', throttle(() => this.updateActiveLink(), CONFIG.throttleDelay));
            this.updateActiveLink();
        }

        updateActiveLink() {
            const scrollPosition = window.pageYOffset + CONFIG.headerHeight + 50;

            let currentSection = null;

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionBottom = sectionTop + section.offsetHeight;

                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentSection = section;
                }
            });

            this.links.forEach(link => {
                link.classList.remove('active');
                link.removeAttribute('aria-current');

                if (currentSection) {
                    const href = link.getAttribute('href');
                    if (href === `#${currentSection.id}`) {
                        link.classList.add('active');
                        link.setAttribute('aria-current', 'page');
                    }
                }
            });
        }
    }

    class ImageLoader {
        constructor() {
            this.init();
        }

        init() {
            const images = document.querySelectorAll('img');

            images.forEach(img => {
                if (!img.hasAttribute('loading') && 
                    !img.classList.contains('c-logo__img') && 
                    !img.hasAttribute('data-critical')) {
                    img.setAttribute('loading', 'lazy');
                }

                if (!img.classList.contains('img-fluid')) {
                    img.classList.add('img-fluid');
                }

                img.addEventListener('error', () => this.handleImageError(img));
            });
        }

        handleImageError(img) {
            const svgPlaceholder = 'data:image/svg+xml;base64,' + btoa(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">' +
                '<rect width="200" height="150" fill="#1a1a1a" stroke="#3a3a3a"/>' +
                '<text x="100" y="75" text-anchor="middle" dy=".3em" fill="#a0a0a0" font-family="sans-serif" font-size="14">Bild nicht verfügbar</text>' +
                '</svg>'
            );
            
            img.src = svgPlaceholder;
            img.style.objectFit = 'contain';
        }
    }

    class CountdownTimer {
        constructor() {
            this.timer = document.getElementById('countdown-timer');
            if (this.timer) {
                this.targetDate = new Date('2024-12-31T23:59:59').getTime();
                this.init();
            }
        }

        init() {
            this.update();
            setInterval(() => this.update(), 1000);
        }

        update() {
            const now = new Date().getTime();
            const distance = this.targetDate - now;

            if (distance < 0) {
                this.timer.innerHTML = '<p class="text-center">Das Angebot ist abgelaufen!</p>';
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.timer.innerHTML = `
                <div class="countdown-box">
                    <div class="display-4">${days}</div>
                    <small>Tage</small>
                </div>
                <div class="countdown-box">
                    <div class="display-4">${hours}</div>
                    <small>Stunden</small>
                </div>
                <div class="countdown-box">
                    <div class="display-4">${minutes}</div>
                    <small>Minuten</small>
                </div>
                <div class="countdown-box">
                    <div class="display-4">${seconds}</div>
                    <small>Sekunden</small>
                </div>
            `;
        }
    }

    class App {
        constructor() {
            this.notificationManager = new NotificationManager();
            this.init();
        }

        init() {
            new BurgerMenu();
            new ScrollAnimations();
            new ButtonAnimations();
            new SmoothScroll();
            new ScrollSpy();
            new ImageLoader();
            new CountdownTimer();

            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                new FormValidator(form, this.notificationManager);
            });

            this.addCustomStyles();
        }

        addCustomStyles() {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new App());
    } else {
        new App();
    }

})();
