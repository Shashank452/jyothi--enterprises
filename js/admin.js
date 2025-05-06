// Global variables
let allProducts = [];
let currentPage = 1;
const productsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the admin panel
    initAdminPanel();
});

function initAdminPanel() {
    loadProducts();
    setupEventListeners();
}

function loadProducts() {
    fetch('products.json')
        .then(response => response.json())
        .then(products => {
            allProducts = products;
            renderProductTable(allProducts);
            updateDashboardStats(allProducts);
        })
        .catch(error => {
            console.error('Error loading products:', error);
            allProducts = [];
            renderProductTable(allProducts);
            updateDashboardStats(allProducts);
        });
}

function setupEventListeners() {
    // Admin sidebar navigation
    const navLinks = document.querySelectorAll('.admin-sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            
            // Update active nav item
            navLinks.forEach(item => {
                item.parentElement.classList.remove('active');
            });
            this.parentElement.classList.add('active');
            
            // Show corresponding section
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = 'index.html';
        }
    });

    // Product modal functionality
    const productModal = document.getElementById('productModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    addProductBtn.addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreviewContainer').style.display = 'none';
        productModal.style.display = 'flex';
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            productModal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Image preview
    document.getElementById('productImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('imagePreview').src = event.target.result;
                document.getElementById('imagePreviewContainer').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Product form submission
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateProductForm()) return;
        
        const productId = document.getElementById('productId').value;
        const isEdit = !!productId;
        
        // Get form values
        const productData = {
            id: isEdit ? productId : Date.now().toString(),
            name: document.getElementById('productName').value.trim(),
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            quantity: document.getElementById('productQuantity').value.trim(),
            status: document.getElementById('productStatus').value,
            description: document.getElementById('productDescription').value.trim(),
            image: document.getElementById('imagePreview').src || 'images/placeholder-product.jpg'
        };
        
        // Handle image upload
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                productData.image = e.target.result;
                saveProductData(productData, isEdit);
            };
            reader.readAsDataURL(imageFile);
        } else {
            saveProductData(productData, isEdit);
        }
    });

    // Product filters
    document.getElementById('productCategoryFilter').addEventListener('change', function() {
        filterProducts();
    });
    
    document.getElementById('productStatusFilter').addEventListener('change', function() {
        filterProducts();
    });
    
    document.getElementById('productSearch').addEventListener('input', function() {
        filterProducts();
    });

    // Pagination
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            filterProducts();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            filterProducts();
        }
    });

    // Settings form submission
    document.getElementById('adminSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Settings saved successfully!');
        // In a real app, you would save these settings to a server
    });

    // Add import/export buttons if they don't exist
    if (!document.getElementById('exportProductsBtn')) {
        const exportBtn = document.createElement('button');
        exportBtn.id = 'exportProductsBtn';
        exportBtn.className = 'btn-secondary';
        exportBtn.textContent = 'Export Products';
        exportBtn.style.marginLeft = '10px';
        
        const importBtn = document.createElement('button');
        importBtn.id = 'importProductsBtn';
        importBtn.className = 'btn-secondary';
        importBtn.textContent = 'Import Products';
        importBtn.style.marginLeft = '10px';
        
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        importInput.addEventListener('change', importProducts);
        
        document.querySelector('.section-header').appendChild(exportBtn);
        document.querySelector('.section-header').appendChild(importBtn);
        document.querySelector('.section-header').appendChild(importInput);
        
        exportBtn.addEventListener('click', exportProducts);
        importBtn.addEventListener('click', () => importInput.click());
    }
}

function validateProductForm() {
    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value;
    
    if (!name) {
        alert('Product name is required');
        return false;
    }
    
    if (!price || isNaN(price)) {
        alert('Please enter a valid price');
        return false;
    }
    
    return true;
}

function saveProductData(productData, isEdit) {
    if (isEdit) {
        const index = allProducts.findIndex(p => p.id === productData.id);
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...productData };
        } else {
            allProducts.push(productData);
        }
    } else {
        if (!productData.id) {
            productData.id = Date.now().toString();
        }
        allProducts.push(productData);
    }
    
    // Just update the UI, no file operations
    renderProductTable(allProducts);
    updateDashboardStats(allProducts);
    document.getElementById('productModal').style.display = 'none';
    alert(`Product ${isEdit ? 'updated' : 'added'} successfully!`);
}

function renderProductTable(products) {
    const tableBody = document.querySelector('#productsTable tbody');
    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="no-products">No products found</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td class="product-image-cell">
                <img src="${product.image || 'images/placeholder-product.jpg'}" alt="${product.name}">
            </td>
            <td>${product.name}</td>
            <td>${formatCategory(product.category)}</td>
            <td>₹${product.price.toFixed(2)}</td>
            <td class="${product.status === 'active' ? 'status-active' : 'status-inactive'}">
                ${product.status === 'active' ? 'Active' : 'Inactive'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" data-id="${product.id}">Edit</button>
                    <button class="btn-delete" data-id="${product.id}">Delete</button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productQuantity').value = product.quantity || '';
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productDescription').value = product.description || '';
    
    if (product.image) {
        document.getElementById('imagePreview').src = product.image;
        document.getElementById('imagePreviewContainer').style.display = 'block';
    } else {
        document.getElementById('imagePreviewContainer').style.display = 'none';
    }
    
    document.getElementById('productModal').style.display = 'flex';
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        allProducts = allProducts.filter(p => p.id !== productId);
        renderProductTable(allProducts);
        updateDashboardStats(allProducts);
        alert('Product deleted successfully!');
    }
}

function filterProducts() {
    const categoryFilter = document.getElementById('productCategoryFilter').value;
    const statusFilter = document.getElementById('productStatusFilter').value;
    const searchQuery = document.getElementById('productSearch').value.toLowerCase();
    
    let filteredProducts = allProducts;
    
    if (categoryFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === categoryFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.status === statusFilter);
    }
    
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery) || 
            (p.description && p.description.toLowerCase().includes(searchQuery))
        );
    }
    
    // Update pagination
    updatePagination(filteredProducts);
    
    // Get current page products
    const startIndex = (currentPage - 1) * productsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);
    
    renderProductTable(paginatedProducts);
}

function updatePagination(filteredProducts) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function formatCategory(category) {
    const categories = {
        'chemical': 'Chemical Items',
        'hygienic': 'Hygienic Materials',
        'branded': 'Branded Products'
    };
    return categories[category] || category;
}

function updateDashboardStats(products) {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('activeProducts').textContent = products.filter(p => p.status === 'active').length;
    
    // In a real app, you would have actual orders and customers data
    document.getElementById('pendingOrders').textContent = '0';
    document.getElementById('totalCustomers').textContent = '0';
    
    // Update recent activity
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    const activities = [
        { icon: 'fas fa-plus', text: `Total products: ${products.length}` },
        { icon: 'fas fa-check', text: `Active products: ${products.filter(p => p.status === 'active').length}` },
        { icon: 'fas fa-user', text: 'Admin logged in' },
        { icon: 'fas fa-clock', text: new Date().toLocaleString() }
    ];
    
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="${activity.icon}"></i> ${activity.text}`;
        activityList.appendChild(li);
    });
}

function exportProducts() {
    const dataStr = JSON.stringify(allProducts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportName = 'products_export_' + new Date().toISOString().slice(0, 10) + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
}

function importProducts(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedProducts = JSON.parse(e.target.result);
            if (Array.isArray(importedProducts) && importedProducts.length > 0) {
                if (confirm(`Import ${importedProducts.length} products? This will replace your current product list.`)) {
                    allProducts = importedProducts;
                    renderProductTable(allProducts);
                    updateDashboardStats(allProducts);
                    alert('Products imported successfully!');
                }
            } else {
                alert('Invalid products file format.');
            }
        } catch (error) {
            console.error('Error importing products:', error);
            alert('Error importing products. Please check the file format.');
        }
    };
    reader.readAsText(file);
    
    // Reset the input to allow re-uploading the same file
    event.target.value = '';
}