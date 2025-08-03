// Property Gallery

document.addEventListener('DOMContentLoaded', function() {
    const mainImage = document.querySelector('.property-gallery .main-image');
    const thumbnails = document.querySelectorAll('.property-gallery .thumbnail');

    if (mainImage && thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                mainImage.src = this.src.replace('thumbnail', 'main');
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    // Property Search Form
    const searchForm = document.querySelector('#property-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const searchParams = new URLSearchParams(formData);
            window.location.href = `/properties/search/?${searchParams.toString()}`;
        });
    }

    // Favorite Property Toggle
    const favoriteButtons = document.querySelectorAll('.favorite-property');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const propertyId = this.dataset.propertyId;

            fetch(`/properties/${propertyId}/toggle-favorite/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    this.classList.toggle('active');
                    const icon = this.querySelector('i');
                    icon.classList.toggle('fas');
                    icon.classList.toggle('far');
                    showAlert('success', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('danger', 'An error occurred. Please try again.');
            });
        });
    });

    // Contact Form
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;

            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

            fetch('/contact/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert('success', 'Message sent successfully!');
                    this.reset();
                } else {
                    showAlert('danger', data.message || 'An error occurred. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('danger', 'An error occurred. Please try again.');
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            });
        });
    }

    // Property Filter
    const filterForm = document.querySelector('#property-filter-form');
    if (filterForm) {
        const filterInputs = filterForm.querySelectorAll('input, select');
        filterInputs.forEach(input => {
            input.addEventListener('change', function() {
                filterForm.submit();
            });
        });
    }

    // Image Upload Preview
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function() {
            const preview = document.querySelector(this.dataset.preview);
            if (preview && this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    });
});

// Utility Functions
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('main').insertBefore(alertDiv, document.querySelector('main').firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Infinite Scroll for Property List
let page = 1;
const loadMoreButton = document.querySelector('#load-more');
if (loadMoreButton) {
    loadMoreButton.addEventListener('click', function() {
        page++;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('page', page);

        fetch(`/properties/search/?${searchParams.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.properties.length > 0) {
                    const propertiesContainer = document.querySelector('#properties-container');
                    data.properties.forEach(property => {
                        propertiesContainer.insertAdjacentHTML('beforeend', property.html);
                    });
                } else {
                    loadMoreButton.style.display = 'none';
                }
            })
            .catch(error => console.error('Error:', error));
    });
}

// Map Integration
function initMap() {
    const mapElement = document.getElementById('property-map');
    if (mapElement) {
        const lat = parseFloat(mapElement.dataset.lat);
        const lng = parseFloat(mapElement.dataset.lng);
        const map = new google.maps.Map(mapElement, {
            center: { lat, lng },
            zoom: 15
        });
        new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: mapElement.dataset.title
        });
    }
}

// WhatsApp Integration
function initWhatsApp() {
    const whatsappButton = document.querySelector('.whatsapp-button');
    if (whatsappButton) {
        const phone = whatsappButton.dataset.phone;
        const message = encodeURIComponent('Hello! I am interested in your property.');
        whatsappButton.href = `https://wa.me/${phone}?text=${message}`;
    }
}

// Initialize all features
document.addEventListener('DOMContentLoaded', function() {
    initWhatsApp();
    if (typeof google !== 'undefined') {
        initMap();
    }
}); 