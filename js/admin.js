// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onValue, 
    update,
    remove,
    get,
    set
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCcH25an44IJd3562IVIcAuEPkxO70kpYg",
    authDomain: "jyothi-enterprises-b9b83.firebaseapp.com",
    databaseURL: "https://jyothi-enterprises-b9b83-default-rtdb.firebaseio.com",
    projectId: "jyothi-enterprises-b9b83",
    storageBucket: "jyothi-enterprises-b9b83.firebasestorage.app",
    messagingSenderId: "308582642392",
    appId: "1:308582642392:web:679986fb1599e3e1915dad",
    measurementId: "G-B9KY51ZQ7E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const adminContainer = document.querySelector('.admin-container');
const loginForm = document.querySelector('.login-form');
const errorMsg = document.querySelector('#errorMsg');

// Global variables
let currentProductId = null;

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        adminContainer.style.display = 'block';
        loginForm.style.display = 'none';
        setupEventListeners();
        fetchProducts();
    } else {
        adminContainer.style.display = 'none';
        loginForm.style.display = 'block';
    }
});

// Event Listeners Setup
function setupEventListeners() {
    // Login form
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Navigation
    const navLinks = document.querySelectorAll('.admin-sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
}

// Navigation handler
function handleNavigation(e) {
    e.preventDefault();
    const sectionId = this.getAttribute('href').substring(1);
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.admin-sidebar a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    this.classList.add('active');
}

// Login handler
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            location.reload();
        })
        .catch((error) => {
            errorMsg.textContent = error.message;
        });
}

// Logout handler
function handleLogout() {
    signOut(auth).then(() => {
        // Redirect to index.html after successful logout
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Error during logout:', error);
        // Even if there's an error, still redirect to index.html
        window.location.href = 'index.html';
    });
}

// Fetch products from Firebase
function fetchProducts() {
    console.log('Fetching products...');
    const productsRef = ref(db, 'products');
    console.log('Database reference created:', productsRef.toString());
    
    const tbody = document.querySelector('#productsTableBody');
    
    if (!tbody) {
        console.error('Products table body not found');
    }

    onValue(productsRef, (snapshot) => {
        console.log('Received snapshot:', snapshot);
        console.log('Snapshot exists:', snapshot.exists());
        
        if (!snapshot.exists()) {
            console.warn('No products data received from Firebase - snapshot does not exist');
            updateDashboardStats([]);
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
            return;
        }
        
        const data = snapshot.val();
        console.log('Raw products data:', data);
        
        if (!data) {
            console.warn('No products data received from Firebase - data is null/undefined');
            updateDashboardStats([]);
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
            return;
        }
        
        // Convert the data object to an array of products with their IDs
        let productsArray = [];
        
        if (Array.isArray(data)) {
            // Handle case where data is an array (shouldn't normally happen with push())
            productsArray = data.map((product, index) => ({
                id: index.toString(),
                ...product
            }));
        } else if (typeof data === 'object') {
            // Handle case where data is an object with push IDs as keys
            productsArray = Object.entries(data).map(([id, product]) => ({
                id: id,
                ...product
            }));
        }
        
        console.log('Processed products array:', productsArray);
        
        // Update the dashboard with the products
        updateDashboardStats(productsArray);
        
        // Render the products in the table
        if (tbody) {
            renderProducts(productsArray);
        }
        
    }, (error) => {
        console.error('Error in onValue callback:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        showNotification('Error loading products: ' + error.message, 'error');
    });
    
    console.log('onValue listener attached');
}

// Render products in the table
function renderProducts(products) {
    const tbody = document.querySelector('#productsTableBody');
    if (!tbody) {
        console.error('Products table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">No products found</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Sort products by name (or any other field you prefer)
    const sortedProducts = [...products].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
    );
    
    sortedProducts.forEach((product, index) => {
        if (!product) return;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="product-info">
                    ${product.image ? `<img src="${product.image}" alt="${product.name || 'Product'}" class="product-thumb" onerror="this.style.display='none'" />` : ''}
                    <span>${product.name || 'N/A'}</span>
                </div>
            </td>
            <td>${product.category || 'N/A'}</td>
            <td>₹${parseFloat(product.price || 0).toFixed(2)}</td>
            <td>${product.quantity || '0'}</td>
            <td>
                <span class="status-badge ${product.status === 'active' ? 'active' : 'inactive'}">
                    ${product.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="actions">
                <button onclick="window.editProduct('${product.id}')" class="btn-icon btn-edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="window.deleteProduct('${product.id}', '${(product.name || 'this product').replace(/'/g, "\\'")}')" class="btn-icon btn-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update dashboard statistics
function updateDashboardStats(products) {
    console.log('=== Updating Dashboard Stats ===');
    console.log('Input products data:', JSON.stringify(products, null, 2));
    
    // If products is null/undefined or not an array/object, set to empty array
    if (!products) {
        products = [];
    } else if (Array.isArray(products)) {
        // If it's an array, filter out null/undefined items
        products = products.filter(Boolean);
    } else if (typeof products === 'object') {
        // If it's an object, convert to array
        products = Object.values(products).filter(Boolean);
    } else {
        products = [];
    }
    
    console.log('Processed product list:', products);
    
    const totalProducts = products.length;
    const activeProductsList = products.filter(p => p.status && p.status.toString().toLowerCase() === 'active');
    const activeProducts = activeProductsList.length;
    const inactiveProducts = totalProducts - activeProducts;
    
    // Calculate total inventory value (sum of prices for active products)
    const totalInventoryValue = activeProductsList.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        return sum + price;
    }, 0);

    console.log('Calculated Stats:', {
        totalProducts,
        activeProducts,
        inactiveProducts,
        totalInventoryValue
    });

    // Update the dashboard UI
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        console.log(`Updating element ${id} with value:`, value);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element with id '${id}' not found`);
        }
    };
    
    updateElement('totalProducts', totalProducts);
    updateElement('activeProducts', activeProducts);
    updateElement('inactiveProducts', inactiveProducts);
    updateElement('totalInventoryValue', '₹' + totalInventoryValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    
    console.log('=== Finished Updating Dashboard Stats ===');
    
    // Update recent products table
    updateRecentProducts(products);
}

// Update recent products table
function updateRecentProducts(products) {
    const recentProductsTable = document.querySelector('#recentProducts tbody');
    if (!recentProductsTable) {
        console.warn('Recent products table not found');
        return;
    }

    recentProductsTable.innerHTML = '';
    
    const recentProducts = [...products].slice(0, 5);
    
    recentProducts.forEach((product, index) => {
        if (!product) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${product.name || 'N/A'}</td>
            <td>${product.category || 'N/A'}</td>
            <td>₹${product.price || '0'}</td>
            <td><span class="status ${product.status === 'active' ? 'active' : 'inactive'}">
                ${product.status || 'inactive'}
            </span></td>
        `;
        recentProductsTable.appendChild(row);
    });
}

// Product Form Handling
function initProductForm() {
    const popup = document.getElementById('productPopup');
    const form = document.getElementById('productForm');
    const closeBtn = popup?.querySelector('.close-popup');
    const cancelBtn = popup?.querySelector('.btn-cancel');
    const statusToggle = document.getElementById('statusToggle');
    const statusText = document.getElementById('statusText');
    const imageInput = form?.querySelector('input[type="url"]');
    const imagePreview = document.getElementById('imagePreview');
    let currentProductId = null;

    // Check if elements exist
    if (!popup || !form || !closeBtn || !cancelBtn || !statusToggle || !statusText || !imageInput || !imagePreview) {
        console.error('Required elements not found for product form');
        return;
    }

    // Toggle status
    statusToggle.addEventListener('change', (e) => {
        statusText.textContent = e.target.checked ? 'Active' : 'Inactive';
    });

    // Image preview
    imageInput.addEventListener('input', (e) => {
        if (e.target.value) {
            imagePreview.src = e.target.value;
            imagePreview.style.display = 'block';
            imagePreview.onload = () => imagePreview.style.display = 'block';
            imagePreview.onerror = () => imagePreview.style.display = 'none';
        } else {
            imagePreview.style.display = 'none';
        }
    });

    // Open popup for adding new product
    window.openAddProductPopup = () => {
        currentProductId = null;
        document.getElementById('popupTitle').textContent = 'Add Product';
        form.reset();
        statusToggle.checked = true;
        statusText.textContent = 'Active';
        if (imagePreview) imagePreview.style.display = 'none';
        popup.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when popup is open
    };

    // Close popup
    const closePopup = () => {
        popup.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scrolling
        // Small delay to allow the fade-out animation
        setTimeout(() => {
            popup.classList.remove('active');
        }, 300);
    };

    // Event listeners
    closeBtn.addEventListener('click', closePopup);
    cancelBtn.addEventListener('click', closePopup);
    
    // Close when clicking outside the popup
    popup.addEventListener('click', (e) => {
        if (e.target === popup) closePopup();
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popup.classList.contains('active')) {
            closePopup();
        }
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const productData = {
                name: form.name.value.trim(),
                category: form.category.value,
                price: parseFloat(form.price.value) || 0,
                quantity: form.quantity.value.trim(),
                description: form.description.value.trim(), // Add description
                status: statusToggle.checked ? 'active' : 'inactive',
                image: form.image.value.trim(),
                updatedAt: new Date().toISOString()
            };
            
            const productId = form.dataset.productId; // Get the product ID from the form
            
            if (productId) {
                // Update existing product
                await updateProduct(productId, productData);
                showNotification('Product updated successfully!', 'success');
            } else {
                // Add new product
                productData.createdAt = new Date().toISOString();
                const newProductId = await addProduct(productData);
                showNotification('Product added successfully!', 'success');
                console.log('New product ID:', newProductId);
            }
            closePopup();
            fetchProducts(); // Refresh the products list
            
        } catch (error) {
            console.error('Error saving product:', error);
            showNotification(`Failed to save product: ${error.message}`, 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// Edit product
window.editProduct = async (productId) => {
    console.log('Edit product clicked:', productId);
    
    try {
        const productRef = ref(db, `products/${productId}`);
        const snapshot = await get(productRef);
        
        if (!snapshot.exists()) {
            throw new Error('Product not found');
        }
        
        const product = { id: productId, ...snapshot.val() };
        const popup = document.getElementById('productPopup');
        const form = document.getElementById('productForm');
        const statusToggle = document.getElementById('statusToggle');
        const statusText = document.getElementById('statusText');
        const imagePreview = document.getElementById('imagePreview');
        
        if (!popup || !form || !statusToggle || !statusText || !imagePreview) {
            throw new Error('Required form elements not found');
        }
        
        // Store the current product ID in a data attribute
        form.dataset.productId = productId;
        
        // Fill the form with product data
        form.name.value = product.name || '';
        form.category.value = product.category || 'chemical';
        form.price.value = product.price || '';
        form.quantity.value = product.quantity || '';
        form.description.value = product.description || ''; // Add description
        statusToggle.checked = product.status !== 'inactive';
        statusText.textContent = statusToggle.checked ? 'Active' : 'Inactive';
        
        if (product.image) {
            form.image.value = product.image;
            imagePreview.src = product.image;
            imagePreview.style.display = 'block';
        } else {
            form.image.value = '';
            imagePreview.style.display = 'none';
        }
        
        // Update the form title and show the popup
        document.getElementById('popupTitle').textContent = 'Edit Product';
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error in editProduct:', error);
        showNotification(`Error loading product: ${error.message}`, 'error');
    }
};

// Update product in Firebase
function updateProduct(productId, productData) {
    const productRef = ref(db, `products/${productId}`);
    return update(productRef, productData);
}

// Add product in Firebase
async function addProduct(productData) {
    try {
        const productRef = ref(db, 'products');
        // Use push() to generate a unique key for each new product
        const newProductRef = push(productRef);
        // Set the product data with the generated key
        await set(newProductRef, productData);
        return newProductRef.key; // Return the generated ID
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
}

// Delete product from Firebase
function deleteProduct(productId) {
    const productRef = ref(db, `products/${productId}`);
    remove(productRef)
        .then(() => {
            alert('Product deleted successfully!');
            fetchProducts();
        })
        .catch(error => {
            alert('Error deleting product: ' + error.message);
        });
}

// Make sure the delete function is also properly exposed
window.deleteProduct = async (productId, productName) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
        return;
    }
    
    try {
        const productRef = ref(db, `products/${productId}`);
        await remove(productRef);
        showNotification('Product deleted successfully', 'success');
        fetchProducts(); // Refresh the products list
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification(`Error deleting product: ${error.message}`, 'error');
    }
};

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // You can replace this with a more sophisticated notification system
    alert(`${type.toUpperCase()}: ${message}`);
}

// Initialize the app
function initApp() {
    setupEventListeners();
    initProductForm();
    fetchProducts();
    
    // Make sure the functions are available globally
    window.openAddProductPopup = openAddProductPopup;
    window.editProduct = window.editProduct || editProduct;
    window.deleteProduct = window.deleteProduct || deleteProduct;
}

// Start the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    function toggleMenu() {
        menuToggle.classList.toggle('active');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }

    // Toggle sidebar when menu button is clicked
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
    }

    // Close sidebar when clicking on overlay or outside the sidebar
    function handleClickOutside(event) {
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(event.target) && 
            !menuToggle.contains(event.target)) {
            toggleMenu();
        }
    }

    // Add event listener for clicks on the document
    document.addEventListener('click', handleClickOutside);

    // Close sidebar when clicking on a nav link (for mobile)
    const navLinks = document.querySelectorAll('.admin-sidebar nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                toggleMenu();
            }
        });
    });

    // Handle window resize
    function handleResize() {
        if (window.innerWidth > 992) {
            // Reset styles when resizing to desktop
            menuToggle.classList.remove('active');
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    window.addEventListener('resize', handleResize);

    initApp();
});
