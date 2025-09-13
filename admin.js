// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAHFBBEbdmAjeugSpbC7hs6EK9JHN7SLDk",
    authDomain: "wearluck-101f5.firebaseapp.com",
    projectId: "wearluck-101f5",
    storageBucket: "wearluck-101f5.appspot.com",
    messagingSenderId: "349280885953",
    appId: "1:349280885953:web:d05d369ecd5ef6df9c0840",
    measurementId: "G-JNFNZ87FEL"
  };

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Test Firebase connection
database.ref('.info/connected').on('value', function(snap) {
    const statusElement = document.getElementById('firebaseStatus');
    if (snap.val() === true) {
        console.log('Connected to Firebase Realtime Database');
        if (statusElement) {
            statusElement.textContent = 'Database Status: Connected ✓';
            statusElement.style.background = '#d4edda';
            statusElement.style.color = '#155724';
        }
    } else {
        console.log('Not connected to Firebase Realtime Database');
        if (statusElement) {
            statusElement.textContent = 'Database Status: Disconnected ✗';
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
        }
    }
});

// Global Variables
let currentAdmin = null;
let editingProduct = null;

// DOM Elements
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize Admin App
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin app initializing...');
    console.log('Firebase config:', firebaseConfig);
    console.log('Auth object:', auth);
    console.log('Database object:', database);
    
    setupEventListeners();
    checkAdminAuthState();
});

function setupEventListeners() {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    
    // Product form
    document.getElementById('productForm')?.addEventListener('submit', handleProductSubmit);
    document.getElementById('productImages')?.addEventListener('change', handleImagePreview);
    
    // Slider form
    document.getElementById('sliderForm')?.addEventListener('submit', handleSliderSubmit);
    document.getElementById('sliderImage')?.addEventListener('change', handleSliderImagePreview);
    
    // Search and filters
    document.getElementById('productSearch')?.addEventListener('input', filterProducts);
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('orderStatusFilter')?.addEventListener('change', filterOrders);
    document.getElementById('returnStatusFilter')?.addEventListener('change', filterReturns);
    document.getElementById('userSearch')?.addEventListener('input', filterUsers);
    
    // Settings
    document.getElementById('shippingForm')?.addEventListener('submit', handleShippingUpdate);
    
    // Test Firebase connection for database operations only
    testFirebaseConnection();
}

// Test Firebase connection
function testFirebaseConnection() {
    console.log('Testing database connection...');
    const statusElement = document.getElementById('firebaseStatus');
    
    if (statusElement) {
        statusElement.textContent = 'Database Status: Testing...';
        statusElement.style.background = '#fff3cd';
        statusElement.style.color = '#856404';
    }
    
    // Test database connection
    database.ref('test').set({
        timestamp: Date.now(),
        message: 'Database connection test'
    }).then(() => {
        console.log('Database write test successful');
        return database.ref('test').remove();
    }).then(() => {
        console.log('Database cleanup successful');
        if (statusElement) {
            statusElement.textContent = 'Database Status: Connected ✓';
            statusElement.style.background = '#d4edda';
            statusElement.style.color = '#155724';
        }
        showNotification('Database connection successful!', 'success');
    }).catch((error) => {
        console.error('Database test failed:', error);
        if (statusElement) {
            statusElement.textContent = 'Database Status: Connection Failed ✗';
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
        }
        showNotification('Database connection failed: ' + error.message, 'error');
    });
}

// Authentication Functions
function checkAdminAuthState() {
    console.log('Checking admin auth state...');
    
    // Check for existing admin session in localStorage
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
        try {
            const session = JSON.parse(adminSession);
            const now = Date.now();
            const sessionAge = now - session.timestamp;
            
            // Session expires after 24 hours
            if (sessionAge < 24 * 60 * 60 * 1000) {
                currentAdmin = session;
                showAdminDashboard();
                loadDashboardStats();
                return;
            } else {
                // Session expired
                localStorage.removeItem('adminSession');
            }
        } catch (error) {
            console.error('Error parsing admin session:', error);
            localStorage.removeItem('adminSession');
        }
    }
    
    showAdminLogin();
}

function handleAdminLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    // Check for specific admin credentials
    if (email === 'genith' && password === '123456') {
        // Create admin session
        const adminSession = {
            name: 'Admin',
            email: 'admin@curiomarket.com',
            isAdmin: true,
            timestamp: Date.now()
        };
        
        // Store admin session in localStorage
        localStorage.setItem('adminSession', JSON.stringify(adminSession));
        
        // Set current admin
        currentAdmin = adminSession;
        
        hideLoading();
        showNotification('Login successful!', 'success');
        
        // Show admin dashboard
        showAdminDashboard();
        loadDashboardStats();
    } else {
        hideLoading();
        showNotification('Invalid admin credentials. Please use User ID: adminCurioNazi and Password: adminNazi56@', 'error');
    }
}

function adminLogout() {
    // Clear admin session from localStorage
    localStorage.removeItem('adminSession');
    currentAdmin = null;
    
    showNotification('Logged out successfully!', 'success');
    showAdminLogin();
}

function showAdminLogin() {
    adminLogin.style.display = 'flex';
    adminDashboard.style.display = 'none';
}

function showAdminDashboard() {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'flex';
    document.getElementById('adminName').textContent = currentAdmin.name || 'Admin';
}

// Navigation Functions
function showSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
    
    // Show selected section
    document.getElementById(`${section}Section`).style.display = 'block';
    
    // Load section data
    switch(section) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'products':
            loadProducts();
            break;
        case 'slider':
            loadSliderImages();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'returns':
            loadReturns();
            break;
        case 'users':
            loadUsers();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard Functions
function loadDashboardStats() {
    // Load total products
    database.ref('products').once('value')
        .then((snapshot) => {
            document.getElementById('totalProducts').textContent = snapshot.numChildren();
        });
    
    // Load total orders
    database.ref('orders').once('value')
        .then((snapshot) => {
            document.getElementById('totalOrders').textContent = snapshot.numChildren();
        });
    
    // Load total users
    database.ref('users').once('value')
        .then((snapshot) => {
            document.getElementById('totalUsers').textContent = snapshot.numChildren();
        });
    
    // Load total revenue
    database.ref('orders').once('value')
        .then((snapshot) => {
            let totalRevenue = 0;
            snapshot.forEach((childSnapshot) => {
                const order = childSnapshot.val();
                if (order.status === 'delivered') {
                    totalRevenue += order.total || 0;
                }
            });
            document.getElementById('totalRevenue').textContent = `₹${totalRevenue}`;
        });
    
    // Load recent orders
    loadRecentOrders();
}

function loadRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrdersList');
    
    database.ref('orders').orderByChild('createdAt').limitToLast(5).once('value')
        .then((snapshot) => {
            recentOrdersList.innerHTML = '';
            const orders = [];
            snapshot.forEach((childSnapshot) => {
                orders.unshift({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = 'order-item';
                orderElement.innerHTML = `
                    <div class="order-summary">
                        <strong>Order #${order.id.slice(-6)}</strong>
                        <span class="order-status ${order.status}">${order.status}</span>
                    </div>
                    <div class="order-amount">₹${order.total}</div>
                `;
                recentOrdersList.appendChild(orderElement);
            });
        });
}

// Product Functions
function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    editingProduct = null;
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    editingProduct = null;
}

function handleImagePreview(e) {
    const files = e.target.files;
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function handleProductSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const formData = {
        title: document.getElementById('productTitle').value,
        price: parseFloat(document.getElementById('productPrice').value),
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value,
        priceOff: parseInt(document.getElementById('productPriceOff').value) || 0,
        trending: document.getElementById('productTrending').checked,
        newArrival: document.getElementById('productNewArrival').checked,
        dealOfDay: document.getElementById('productDealOfDay').checked,
        createdAt: Date.now()
    };
    
    const files = document.getElementById('productImages').files;
    const uploadPromises = [];
    
    for (let file of files) {
        const storageRef = storage.ref(`products/${Date.now()}_${file.name}`);
        uploadPromises.push(storageRef.put(file).then(snapshot => snapshot.ref.getDownloadURL()));
    }
    
    Promise.all(uploadPromises)
        .then((imageUrls) => {
            formData.images = imageUrls;
            
            if (editingProduct) {
                return database.ref(`products/${editingProduct}`).update(formData);
            } else {
                return database.ref('products').push(formData);
            }
        })
        .then(() => {
            hideLoading();
            showNotification(editingProduct ? 'Product updated successfully!' : 'Product added successfully!', 'success');
            hideAddProductForm();
            loadProducts();
        })
        .catch((error) => {
            hideLoading();
            showNotification(error.message, 'error');
        });
}

function loadProducts() {
    const productsList = document.getElementById('productsList');
    
    database.ref('products').once('value')
        .then((snapshot) => {
            productsList.innerHTML = '';
            const products = [];
            snapshot.forEach((childSnapshot) => {
                products.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            
            products.forEach(product => {
                productsList.appendChild(createProductCard(product));
            });
            
            // Load categories for filter
            loadCategories(products);
        });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
        <img src="${product.images[0]}" alt="${product.title}" class="product-image">
        <div class="product-info">
            <div class="product-title">${product.title}</div>
            <div class="product-price">₹${product.price}</div>
            <div class="product-category">${product.category}</div>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct('${product.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteProduct('${product.id}')">Delete</button>
            </div>
        </div>
    `;
    
    return card;
}

function editProduct(productId) {
    editingProduct = productId;
    
    database.ref(`products/${productId}`).once('value')
        .then((snapshot) => {
            const product = snapshot.val();
            
            document.getElementById('productTitle').value = product.title;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productDescription').value = product.description;
            document.getElementById('productPriceOff').value = product.priceOff || 0;
            document.getElementById('productTrending').checked = product.trending || false;
            document.getElementById('productNewArrival').checked = product.newArrival || false;
            document.getElementById('productDealOfDay').checked = product.dealOfDay || false;
            
            // Show existing images
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = '';
            product.images.forEach(imageUrl => {
                const img = document.createElement('img');
                img.src = imageUrl;
                preview.appendChild(img);
            });
            
            showAddProductForm();
        });
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        showLoading();
        
        database.ref(`products/${productId}`).remove()
            .then(() => {
                hideLoading();
                showNotification('Product deleted successfully!', 'success');
                loadProducts();
            })
            .catch((error) => {
                hideLoading();
                showNotification(error.message, 'error');
            });
    }
}

function loadCategories(products) {
    const categories = [...new Set(products.map(p => p.category))];
    const categoryFilter = document.getElementById('categoryFilter');
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const productsList = document.getElementById('productsList');
    
    database.ref('products').once('value')
        .then((snapshot) => {
            productsList.innerHTML = '';
            const products = [];
            snapshot.forEach((childSnapshot) => {
                const product = { id: childSnapshot.key, ...childSnapshot.val() };
                
                const matchesSearch = product.title.toLowerCase().includes(searchTerm) ||
                                    product.category.toLowerCase().includes(searchTerm);
                const matchesCategory = !categoryFilter || product.category === categoryFilter;
                
                if (matchesSearch && matchesCategory) {
                    products.push(product);
                }
            });
            
            products.forEach(product => {
                productsList.appendChild(createProductCard(product));
            });
        });
}

// Slider Functions
function showAddSliderForm() {
    document.getElementById('addSliderForm').style.display = 'block';
    document.getElementById('sliderForm').reset();
    document.getElementById('sliderImagePreview').innerHTML = '';
}

function hideAddSliderForm() {
    document.getElementById('addSliderForm').style.display = 'none';
}

function handleSliderImagePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('sliderImagePreview');
    preview.innerHTML = '';
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function handleSliderSubmit(e) {
    e.preventDefault();
    showLoading();
    
    const file = document.getElementById('sliderImage').files[0];
    const storageRef = storage.ref(`slider/${Date.now()}_${file.name}`);
    
    storageRef.put(file)
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then((imageUrl) => {
            return database.ref('slider').push(imageUrl);
        })
        .then(() => {
            hideLoading();
            showNotification('Slider image added successfully!', 'success');
            hideAddSliderForm();
            loadSliderImages();
        })
        .catch((error) => {
            hideLoading();
            showNotification(error.message, 'error');
        });
}

function loadSliderImages() {
    const sliderImagesList = document.getElementById('sliderImagesList');
    
    database.ref('slider').once('value')
        .then((snapshot) => {
            sliderImagesList.innerHTML = '';
            snapshot.forEach((childSnapshot) => {
                const imageUrl = childSnapshot.val();
                const imageId = childSnapshot.key;
                
                const card = document.createElement('div');
                card.className = 'slider-image-card';
                card.innerHTML = `
                    <img src="${imageUrl}" alt="Slider Image">
                    <div class="slider-image-actions">
                        <button class="delete-btn" onclick="deleteSliderImage('${imageId}')">Delete</button>
                    </div>
                `;
                sliderImagesList.appendChild(card);
            });
        });
}

function deleteSliderImage(imageId) {
    if (confirm('Are you sure you want to delete this slider image?')) {
        showLoading();
        
        database.ref(`slider/${imageId}`).remove()
            .then(() => {
                hideLoading();
                showNotification('Slider image deleted successfully!', 'success');
                loadSliderImages();
            })
            .catch((error) => {
                hideLoading();
                showNotification(error.message, 'error');
            });
    }
}

// Order Functions
function loadOrders() {
    const ordersList = document.getElementById('ordersList');
    
    database.ref('orders').orderByChild('createdAt').once('value')
        .then((snapshot) => {
            ordersList.innerHTML = '';
            const orders = [];
            snapshot.forEach((childSnapshot) => {
                orders.unshift({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            
            orders.forEach(order => {
                ordersList.appendChild(createOrderCard(order));
            });
        });
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    
    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">Order #${order.id.slice(-6)}</div>
            <div class="order-status ${order.status}">${order.status}</div>
        </div>
        <div class="order-details">
            <div>
                <strong>Customer:</strong> ${order.deliveryDetails.fullName}<br>
                <strong>Phone:</strong> ${order.deliveryDetails.phoneNumber}<br>
                <strong>Date:</strong> ${orderDate}
            </div>
            <div>
                <strong>Product Total:</strong> ₹${order.total}<br>
                <strong>Shipping:</strong> ₹${order.shippingCharge || 0}<br>
                <strong>Grand Total:</strong> ₹${order.grandTotal || order.total}<br>
                <strong>Payment:</strong> ${order.paymentMethod || 'N/A'}
            </div>
        </div>
        <div class="order-address" id="address-${order.id}">
            <strong>Delivery Address:</strong><br>
            ${order.deliveryDetails.fullName}<br>
            ${order.deliveryDetails.houseNo}, ${order.deliveryDetails.roadName}<br>
            ${order.deliveryDetails.city}, ${order.deliveryDetails.state} - ${order.deliveryDetails.pincode}<br>
            Phone: ${order.deliveryDetails.phoneNumber}
        </div>
        <div class="order-actions">
            <button class="download-address-btn" onclick="downloadAddressAsImage('${order.id}')">
                <i class="fas fa-download"></i> Download Address
            </button>
            <button class="status-btn" style="background: #ffc107;" onclick="updateOrderStatus('${order.id}', 'pending')">Pending</button>
            <button class="status-btn" style="background: #17a2b8;" onclick="updateOrderStatus('${order.id}', 'confirmed')">Confirmed</button>
            <button class="status-btn" style="background: #28a745;" onclick="updateOrderStatus('${order.id}', 'processing')">Processing</button>
            <button class="status-btn" style="background: #007bff;" onclick="updateOrderStatus('${order.id}', 'shipped')">Shipped</button>
            <button class="status-btn" style="background: #6f42c1;" onclick="updateOrderStatus('${order.id}', 'delivered')">Delivered</button>
            <button class="status-btn" style="background: #dc3545;" onclick="updateOrderStatus('${order.id}', 'cancelled')">Cancelled</button>
        </div>
        <div class="order-products">
            <strong>Products:</strong>
            ${order.products.map(product => `
                <div class="order-product">
                    <img src="${product.image}" alt="${product.title}">
                    <div>
                        <div>${product.title}</div>
                        <div>Qty: ${product.quantity} | ₹${product.price}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    return card;
}

function updateOrderStatus(orderId, status) {
    showLoading();
    
    const updateData = { status: status };
    
    // Add delivered timestamp when marking as delivered
    if (status === 'delivered') {
        updateData.deliveredAt = Date.now();
    }
    
    database.ref(`orders/${orderId}`).update(updateData)
        .then(() => {
            hideLoading();
            showNotification('Order status updated successfully!', 'success');
            loadOrders();
        })
        .catch((error) => {
            hideLoading();
            showNotification(error.message, 'error');
        });
}

function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter').value;
    const ordersList = document.getElementById('ordersList');
    
    database.ref('orders').orderByChild('createdAt').once('value')
        .then((snapshot) => {
            ordersList.innerHTML = '';
            const orders = [];
            snapshot.forEach((childSnapshot) => {
                const order = { id: childSnapshot.key, ...childSnapshot.val() };
                
                if (!statusFilter || order.status === statusFilter) {
                    orders.unshift(order);
                }
            });
            
            orders.forEach(order => {
                ordersList.appendChild(createOrderCard(order));
            });
        });
}

// User Functions
function loadUsers() {
    const usersList = document.getElementById('usersList');
    
    database.ref('users').once('value')
        .then((snapshot) => {
            usersList.innerHTML = '';
            snapshot.forEach((childSnapshot) => {
                const user = { id: childSnapshot.key, ...childSnapshot.val() };
                usersList.appendChild(createUserCard(user));
            });
        });
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const joinDate = new Date(user.createdAt).toLocaleDateString();
    
    card.innerHTML = `
        <div class="user-info">
            <h3>${user.name}</h3>
            <p>${user.email}</p>
            <p>Joined: ${joinDate}</p>
        </div>
        <div class="user-actions">
            <button class="edit-btn" onclick="viewUserOrders('${user.id}')">View Orders</button>
        </div>
    `;
    
    return card;
}

function viewUserOrders(userId) {
    // This could open a modal or navigate to show user's orders
    showNotification('User orders feature coming soon!', 'info');
}

function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const usersList = document.getElementById('usersList');
    
    database.ref('users').once('value')
        .then((snapshot) => {
            usersList.innerHTML = '';
            snapshot.forEach((childSnapshot) => {
                const user = { id: childSnapshot.key, ...childSnapshot.val() };
                
                if (user.name.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm)) {
                    usersList.appendChild(createUserCard(user));
                }
            });
        });
}

// Utility Functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        z-index: 3000;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function downloadAddressAsImage(orderId) {
    const addressElement = document.getElementById(`address-${orderId}`);
    if (!addressElement) {
        showNotification('Address element not found', 'error');
        return;
    }
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 400;
    canvas.height = 200;
    
    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add border
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Set text styles
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    
    // Add title
    ctx.fillText('Delivery Address', 20, 40);
    
    // Get address text
    const addressText = addressElement.innerText.replace('Delivery Address:', '').trim();
    const lines = addressText.split('\n');
    
    // Add address lines
    ctx.font = '14px Arial';
    let y = 70;
    lines.forEach(line => {
        if (line.trim()) {
            ctx.fillText(line.trim(), 20, y);
            y += 25;
        }
    });
    
    // Add order ID
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#667eea';
    ctx.fillText(`Order #${orderId.slice(-6)}`, 20, canvas.height - 20);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `address-order-${orderId.slice(-6)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Address image downloaded successfully!', 'success');
    }, 'image/png');
}

// Settings Functions
function loadSettings() {
    loadShippingCharge();
}

function loadShippingCharge() {
    database.ref('settings/shippingCharge').once('value')
        .then((snapshot) => {
            const charge = snapshot.val() || 0;
            document.getElementById('shippingCharge').value = charge;
            document.getElementById('shippingChargeValue').textContent = `₹${charge}`;
        })
        .catch((error) => {
            console.error('Error loading shipping charge:', error);
            showNotification('Error loading shipping charge', 'error');
        });
}

function handleShippingUpdate(e) {
    e.preventDefault();
    showLoading();
    
    const charge = parseInt(document.getElementById('shippingCharge').value);
    
    if (isNaN(charge) || charge < 0) {
        hideLoading();
        showNotification('Please enter a valid shipping charge', 'error');
        return;
    }
    
    database.ref('settings/shippingCharge').set(charge)
        .then(() => {
            hideLoading();
            document.getElementById('shippingChargeValue').textContent = `₹${charge}`;
            showNotification('Shipping charge updated successfully!', 'success');
        })
        .catch((error) => {
            hideLoading();
            console.error('Error updating shipping charge:', error);
                    showNotification('Error updating shipping charge', 'error');
    });
}

// Returns Management Functions
function loadReturns() {
    const returnsList = document.getElementById('returnsList');
    if (!returnsList) return;
    
    database.ref('returns').orderByChild('createdAt').once('value')
        .then((snapshot) => {
            returnsList.innerHTML = '';
            if (snapshot.exists()) {
                const returns = [];
                snapshot.forEach((childSnapshot) => {
                    returns.unshift({ id: childSnapshot.key, ...childSnapshot.val() });
                });
                
                returns.forEach(returnItem => {
                    returnsList.appendChild(createReturnCard(returnItem));
                });
            } else {
                returnsList.innerHTML = '<p>No returns found</p>';
            }
        });
}

function createReturnCard(returnItem) {
    const card = document.createElement('div');
    card.className = 'return-card';
    
    const returnDate = new Date(returnItem.createdAt).toLocaleDateString();
    
    card.innerHTML = `
        <div class="return-header">
            <div class="return-id">Return #${returnItem.id.slice(-6)}</div>
            <div class="return-status ${returnItem.status}">${returnItem.status}</div>
        </div>
        <div class="return-details">
            <div class="return-info">
                <strong>Customer:</strong> ${returnItem.userName}<br>
                <strong>Order ID:</strong> #${returnItem.orderId.slice(-6)}<br>
                <strong>Date:</strong> ${returnDate}<br>
                <strong>Reason:</strong> ${returnItem.reason}<br>
                <strong>UPI ID:</strong> ${returnItem.upiId}<br>
                <strong>Mobile:</strong> ${returnItem.mobile}
            </div>
            ${returnItem.details ? `<div class="return-description"><strong>Details:</strong> ${returnItem.details}</div>` : ''}
        </div>
        <div class="return-actions">
            <button class="status-btn" style="background: #28a745;" onclick="updateReturnStatus('${returnItem.id}', 'approved')">Approve</button>
            <button class="status-btn" style="background: #dc3545;" onclick="updateReturnStatus('${returnItem.id}', 'rejected')">Reject</button>
            <button class="status-btn" style="background: #17a2b8;" onclick="updateReturnStatus('${returnItem.id}', 'refunded')">Mark Refunded</button>
        </div>
    `;
    
    return card;
}

function updateReturnStatus(returnId, status) {
    console.log('Admin updating return status:', returnId, 'to:', status);
    
    database.ref(`returns/${returnId}`).update({ status: status })
        .then(() => {
            console.log('Return status updated successfully in admin panel');
            showNotification('Return status updated successfully!', 'success');
            loadReturns(); // Refresh the returns list
        })
        .catch((error) => {
            console.error('Error updating return status in admin panel:', error);
            showNotification('Error updating return status', 'error');
        });
}

function filterReturns() {
    const statusFilter = document.getElementById('returnStatusFilter').value;
    const returnsList = document.getElementById('returnsList');
    
    if (!returnsList) return;
    
    database.ref('returns').orderByChild('createdAt').once('value')
        .then((snapshot) => {
            returnsList.innerHTML = '';
            if (snapshot.exists()) {
                const returns = [];
                snapshot.forEach((childSnapshot) => {
                    const returnItem = { id: childSnapshot.key, ...childSnapshot.val() };
                    if (!statusFilter || returnItem.status === statusFilter) {
                        returns.unshift(returnItem);
                    }
                });
                
                if (returns.length === 0) {
                    returnsList.innerHTML = '<p>No returns found with the selected status</p>';
                } else {
                    returns.forEach(returnItem => {
                        returnsList.appendChild(createReturnCard(returnItem));
                    });
                }
            } else {
                returnsList.innerHTML = '<p>No returns found</p>';
            }
        });
}
