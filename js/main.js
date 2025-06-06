// Firebase configuration
const firebaseConfig = {
    databaseURL: "https://jyothi-enterprises-b9b83-default-rtdb.firebaseio.com/"
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // Mobile menu toggle functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Function to close the menu
    const closeMenu = () => {
        if (navLinks && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
        }
    };
    
    if (menuToggle && navLinks) {
        // Toggle menu when clicking the menu button
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling to document
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            const isClickInsideMenu = navLinks.contains(e.target) || menuToggle.contains(e.target);
            if (!isClickInsideMenu && navLinks.classList.contains('active')) {
                closeMenu();
            }
        });
        
        // Prevent clicks inside the menu from closing it
        navLinks.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Close menu when a nav link is clicked (for better mobile UX)
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
    
    // Fetch products using REST API
    fetch(`${firebaseConfig.databaseURL}products.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Received data from Firebase:", data);
            const products = [];
            
            // Convert the object of products to an array
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    const product = data[key];
                    // Only include active products
                    if (product.status === 'active') {
                        products.push({
                            id: key,
                            ...product
                        });
                    }
                }
            }
            
            console.log("Processed products:", products);
            displayProducts(products);
            setupCategoryFilters(products);
        })
        .catch(error => {
            console.error("Error fetching products:", error);
            // Show error message to user
            const productGrid = document.getElementById('productGrid');
            if (productGrid) {
                productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
            }
        });

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
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            // Close mobile menu if open
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Use scrollIntoView with smooth behavior
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Update URL without adding to history
                if (history.pushState) {
                    history.pushState(null, null, targetId);
                } else {
                    window.location.hash = targetId;
                }
            }
        });
    });

    // Contact form submission
    const contactForm = document.getElementById('messageForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                // Check if EmailJS is loaded
                if (typeof emailjs === 'undefined') {
                    throw new Error('EmailJS is not loaded');
                }
                
                // Get current time
                const now = new Date();
                const timeString = now.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                
                // Get form values
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim() || 'Not provided';
                const message = document.getElementById('message').value.trim();
                
                if (!name || !email || !message) {
                    throw new Error('Please fill in all required fields');
                }
                
                // Show loading state
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
                
                console.log('Sending email with data:', { name, email, phone, time: timeString, message });
                
                // Send email using EmailJS with template variables
                const response = await emailjs.send(
                    'service_3c5a53x', // Service ID
                    'template_batzvyp', // Template ID
                    {
                        name: name,
                        email: email,
                        phone: phone,
                        time: timeString,
                        message: message
                    },
                    'p3mv37Yr2gJuc11gQ' // Public Key
                );
                
                console.log('Email sent successfully!', response);
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
                
            } catch (error) {
                console.error('Error:', error);
                alert(`Failed to send message: ${error.message || 'Please try again later.'}`);
            } finally {
                // Reset button state
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Message';
                }
            }
        });
    }
});

function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) {
        console.error("Product grid element not found");
        return;
    }
    
    // Clear existing products
    productGrid.innerHTML = '';
    
    if (products.length === 0) {
        productGrid.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Format the WhatsApp message with product details
        const whatsappMessage = `Hi, I'm interested in ${product.name} (${product.quantity || ''}) - ₹${product.price}.`;
        const encodedMessage = encodeURIComponent(whatsappMessage);
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image || 'images/placeholder-product.jpg'}" alt="${product.name}" onerror="this.src='images/placeholder-product.jpg'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${product.category ? `<p class="category">${product.category}</p>` : ''}
                ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                <div class="product-meta">
                    <span class="product-price">₹${product.price}</span>
                    ${product.quantity ? `<span class="product-quantity">${product.quantity}</span>` : ''}
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
    });
}

function setupCategoryFilters(products) {
    const categoryContainer = document.querySelector('.product-categories');
    if (!categoryContainer) return;
    
    // Clear existing buttons except the first one (All Products)
    while (categoryContainer.children.length > 1) {
        categoryContainer.removeChild(categoryContainer.lastChild);
    }
    
    // Get unique categories
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
    
    // Create category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.textContent = category;
        button.setAttribute('data-category', category.toLowerCase().replace(/\s+/g, '-'));
        button.addEventListener('click', () => filterProducts(category));
        categoryContainer.appendChild(button);
    });
    
    // Add event listeners to all category buttons
    const categoryButtons = categoryContainer.querySelectorAll('button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
    
    function filterProducts(category) {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const cardCategory = card.querySelector('.category')?.textContent.toLowerCase();
            if (category === 'all' || !category || cardCategory === category.toLowerCase()) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
}