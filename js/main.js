document.addEventListener('DOMContentLoaded', function() {
    // Load products from JSON file
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            displayProducts(products);
            setupCategoryFilters(products);
        })
        .catch(error => console.error('Error loading products:', error));

    // Tab functionality for customers section
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Contact form submission
    const contactForm = document.getElementById('messageForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            // Here you would typically send the data to a server
            console.log('Form submitted:', { name, email, phone, message });
            
            // Show success message
            alert('Thank you for your message! We will get back to you soon.');
            
            // Reset form
            contactForm.reset();
        });
    }
});

function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    products.forEach(product => {
        if (product.status === 'active') {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            // Format the WhatsApp message with product details
            const whatsappMessage = `Hi, I'm interested in ${product.name} (${product.quantity || ''}) - ₹${product.price.toFixed(2)}.`;
            const encodedMessage = encodeURIComponent(whatsappMessage);
            
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image || 'images/placeholder-product.jpg'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description || ''}</p>
                    <div class="product-meta">
                        <span class="product-price">₹${product.price.toFixed(2)}</span>
                        <span class="product-quantity">${product.quantity || ''}</span>
                    </div>
                    <div class="product-actions">
                        <a href="tel:+918970128495" class="buy-btn mobile-only">
                            <i class="fas fa-phone"></i> Call to Order
                        </a>
                        <a href="https://wa.me/918970128495?text=${encodedMessage}" target="_blank" class="buy-btn desktop-only">
                            <i class="fab fa-whatsapp"></i> WhatsApp Order
                        </a>
                    </div>
                </div>
            `;
            
            productGrid.appendChild(productCard);
        }
    });
}

function setupCategoryFilters(products) {
    const categoryButtons = document.querySelectorAll('.product-categories button');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter products
            const category = this.getAttribute('data-category');
            let filteredProducts = products;
            
            if (category !== 'all') {
                filteredProducts = products.filter(product => 
                    product.category === category && product.status === 'active'
                );
            } else {
                filteredProducts = products.filter(product => product.status === 'active');
            }
            
            displayProducts(filteredProducts);
        });
    });
}