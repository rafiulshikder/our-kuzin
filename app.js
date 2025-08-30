// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBI9qyE4WJM8ENsOKFukfonT1KjImHFh3o",
    authDomain: "rafi-72121.firebaseapp.com",
    databaseURL: "https://rafi-72121-default-rtdb.firebaseio.com",
    projectId: "rafi-72121",
    storageBucket: "rafi-72121.firebasestorage.app",
    messagingSenderId: "41402384792",
    appId: "1:41402384792:web:a8f60ae4d0e2d86f766bed",
    measurementId: "G-WD145PEETY"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// Global Variables
let currentUser = null;
let currentProduct = null;
let cart = [];
let wishlist = [];
let currentOrder = null;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthState();
    loadHomePage();
});

function initializeApp() {
    // Load cart and wishlist from localStorage
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
}

function setupEventListeners() {
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
            document.getElementById('forgotPasswordModal').style.display = 'none';
        });
    });
    
    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('forgotPasswordForm')?.addEventListener('submit', handleForgotPassword);
    
    // Search
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Slider controls
    document.getElementById('prevBtn').addEventListener('click', () => changeSlide(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changeSlide(1));
}

// Authentication Functions
function checkAuthState() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loadUserData();
            
            // Store user session in localStorage for persistence
            localStorage.setItem('userSession', JSON.stringify({
                uid: user.uid,
                email: user.email,
                timestamp: Date.now()
            }));
        } else {
            currentUser = null;
            
            // Clear user session from localStorage
            localStorage.removeItem('userSession');
        }
    });
}

function handleLogin(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Check if input is mobile number or email
    const isMobileNumber = /^\d{10}$/.test(email);
    
    if (isMobileNumber) {
        // Login with mobile number
        loginWithMobileNumber(email, password);
    } else {
        // Login with email
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                hideLoading();
                loginModal.style.display = 'none';
                showNotification('Login successful!', 'success');
            })
            .catch((error) => {
                hideLoading();
                showNotification(error.message, 'error');
            });
    }
}

function loginWithMobileNumber(mobileNumber, password) {
    // Find user by mobile number
    database.ref('users').orderByChild('mobileNumber').equalTo(mobileNumber).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const userId = Object.keys(userData)[0];
                const userEmail = userData[userId].email;
                
                // Login with email
                return auth.signInWithEmailAndPassword(userEmail, password);
            } else {
                throw new Error('No user found with this mobile number');
            }
        })
        .then(() => {
            hideLoading();
            loginModal.style.display = 'none';
            showNotification('Login successful!', 'success');
        })
        .catch((error) => {
            hideLoading();
            showNotification(error.message, 'error');
        });
}

function handleForgotPassword(e) {
    e.preventDefault();
    showLoading();
    
    const email = document.getElementById('forgotEmail').value;
    
    if (!email) {
        hideLoading();
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            hideLoading();
            showNotification('Password reset email sent! Check your inbox.', 'success');
            document.getElementById('forgotPasswordModal').style.display = 'none';
        })
        .catch((error) => {
            hideLoading();
            showNotification(error.message, 'error');
        });
}

function handleRegister(e) {
    e.preventDefault();
    showLoading();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const mobileNumber = document.getElementById('registerMobile').value;
    
    // Validate mobile number
    if (!mobileNumber || mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
        hideLoading();
        showNotification('Please enter a valid 10-digit mobile number', 'error');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return database.ref(`users/${user.uid}`).set({
                name: name,
                email: email,
                mobileNumber: mobileNumber,
                createdAt: Date.now()
            });
        })
        .then(() => {
            hideLoading();
            registerModal.style.display = 'none';
            showNotification('Registration successful!', 'success');
        })
        .catch((error) => {
            hideLoading();
            showNotification(error.message, 'error');
        });
}

function logout() {
    auth.signOut()
        .then(() => {
            showNotification('Logged out successfully!', 'success');
        })
        .catch((error) => {
            showNotification(error.message, 'error');
        });
}

function loadUserData() {
    if (!currentUser) return;
    
    database.ref(`users/${currentUser.uid}`).once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                localStorage.setItem('userData', JSON.stringify(userData));
            }
        });
}

// Navigation Functions
function navigateTo(page, element = null) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        // Find the nav item for this page
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(page)) {
                item.classList.add('active');
            }
        });
    }
    
    // Hide all pages
    hideAllPages();
    
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'search':
            loadSearchPage();
            break;
        case 'wishlist':
            loadWishlistPage();
            break;
        case 'cart':
            loadCartPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
    }
}

function hideAllPages() {
    // Hide main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'none';
    
    // Hide dynamically created pages
    const pages = document.querySelectorAll('.product-page, .order-page, .payment-page, .search-results, .wishlist-page, .cart-page, .profile-page, .policy-page, .addresses-page, .orders-page');
    pages.forEach(page => {
        if (page) page.style.display = 'none';
    });
}

// Home Page Functions
function loadHomePage() {
    const mainContent = document.querySelector('.main-content');
    mainContent.style.display = 'block';
    
    loadSlider();
    loadTrendingProducts();
    loadNewArrivals();
    loadDealOfTheDay();
}

function loadSlider() {
    const slider = document.getElementById('slider');
    
    database.ref('slider').once('value')
        .then((snapshot) => {
            const sliderData = snapshot.val();
            if (sliderData) {
                slider.innerHTML = '';
                Object.values(sliderData).forEach(imageUrl => {
                    const img = document.createElement('img');
                    img.src = imageUrl;
                    img.alt = 'Slider Image';
                    slider.appendChild(img);
                });
            }
        });
}

function loadTrendingProducts() {
    const container = document.getElementById('trendingProducts');
    
    database.ref('products').orderByChild('trending').equalTo(true).limitToFirst(10).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            const products = [];
            snapshot.forEach((childSnapshot) => {
                products.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            
            products.forEach(product => {
                container.appendChild(createProductCard(product));
            });
        });
}

function loadNewArrivals() {
    const container = document.getElementById('newArrivals');
    
    database.ref('products').orderByChild('newArrival').equalTo(true).limitToFirst(10).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            const products = [];
            snapshot.forEach((childSnapshot) => {
                products.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            
            products.forEach(product => {
                container.appendChild(createProductCard(product));
            });
        });
}

function loadDealOfTheDay() {
    const container = document.getElementById('dealOfTheDay');
    
    database.ref('products').orderByChild('dealOfDay').equalTo(true).limitToFirst(10).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            const products = [];
            snapshot.forEach((childSnapshot) => {
                products.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
            
            products.forEach(product => {
                container.appendChild(createProductCard(product));
            });
        });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openProductPage(product);
    
    card.innerHTML = `
        <img src="${product.images[0]}" alt="${product.title}" class="product-image">
        <div class="product-info">
            <div class="product-title">${product.title}</div>
            <div class="product-price">₹${product.price}</div>
        </div>
    `;
    
    return card;
}

// Product Page Functions
function openProductPage(product) {
    currentProduct = product;
    hideAllPages();
    
    // Create product page if it doesn't exist
    let productPage = document.querySelector('.product-page');
    if (!productPage) {
        productPage = document.createElement('div');
        productPage.className = 'product-page';
        document.body.appendChild(productPage);
    }
    
    productPage.innerHTML = `
        <div class="product-details">
            <div class="product-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>
            
            <div class="product-image-section">
                <img src="${product.images[0]}" alt="${product.title}" class="product-main-image">
                <div class="product-actions-top">
                    <button class="action-btn-top wishlist-btn" onclick="toggleWishlist('${product.id}')">
                        <i class="fas fa-heart"></i> Wishlist
                    </button>
                    <button class="action-btn-top share-btn" onclick="shareProduct('${product.id}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
            
            <div class="product-title-large">${product.title}</div>
            <div class="product-price-large">₹${product.price}</div>
            ${product.priceOff ? `<div class="price-off">${product.priceOff}% OFF</div>` : ''}
            
            <div class="product-rating">
                <div class="rating-stars">
                    ${generateRatingStars(product.averageRating || 0)}
                </div>
                <span class="rating-text">${product.averageRating ? product.averageRating.toFixed(1) : 'No ratings'} (${product.totalRatings || 0} reviews)</span>
            </div>
            
            <div class="product-actions-large">
                <button class="action-btn-large buy-now-btn" onclick="buyNow('${product.id}')">Buy Now</button>
                <button class="action-btn-large add-cart-btn" onclick="addToCart('${product.id}')">Add to Cart</button>
            </div>
            
            <!-- Return Button for Delivered Orders -->
            <div id="returnSection" class="return-section" style="display: none;">
                <button class="return-btn" onclick="openReturnForm('${product.id}')">Return Product</button>
            </div>
            
            <div class="quantity-selector">
                <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
                <input type="number" class="quantity-input" id="quantityInput" value="1" min="1">
                <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
            </div>
            
            <div class="product-description">${product.description}</div>
            
            <!-- Rating and Review Section -->
            <div class="rating-section">
                <h3>Rate this Product</h3>
                <div class="rating-input">
                    <div class="star-rating">
                        ${generateStarRatingInput()}
                    </div>
                    <textarea id="reviewText" placeholder="Write your review (optional)..." rows="3"></textarea>
                    <button class="submit-rating-btn" onclick="submitRating('${product.id}')">Submit Rating</button>
                </div>
            </div>
            
            <!-- Reviews Display -->
            <div class="reviews-section">
                <h3>Customer Reviews</h3>
                <div id="reviewsContainer" class="reviews-container">
                    <!-- Reviews will be loaded here -->
                </div>
            </div>
            
            <!-- Recommended Products -->
            <div class="recommended-section">
                <h3>You May Also Like</h3>
                <div id="recommendedProducts" class="recommended-products">
                    <!-- Recommended products will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    // Load reviews and recommended products
    loadProductReviews(product.id);
    loadRecommendedProducts(product.category, product.id);
    
    productPage.style.display = 'block';
}

function changeQuantity(delta) {
    const input = document.getElementById('quantityInput');
    const newValue = Math.max(1, parseInt(input.value) + delta);
    input.value = newValue;
}

// Rating Functions
function generateRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star filled"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt filled"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function generateStarRatingInput() {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="far fa-star" data-rating="${i}" onclick="setRating(${i})"></i>`;
    }
    return stars;
}

let currentRating = 0;

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star filled';
        } else {
            star.className = 'far fa-star';
        }
    });
}

function submitRating(productId) {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    if (currentRating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }
    
    const reviewText = document.getElementById('reviewText').value;
    
    const ratingData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        rating: currentRating,
        review: reviewText,
        timestamp: Date.now()
    };
    
    // Save rating to database
    database.ref(`products/${productId}/ratings/${currentUser.uid}`).set(ratingData)
        .then(() => {
            // Update product average rating
            updateProductRating(productId);
            showNotification('Rating submitted successfully!', 'success');
            currentRating = 0;
            document.getElementById('reviewText').value = '';
            loadProductReviews(productId);
        })
        .catch((error) => {
            showNotification('Error submitting rating', 'error');
        });
}

function updateProductRating(productId) {
    database.ref(`products/${productId}/ratings`).once('value')
        .then((snapshot) => {
            const ratings = snapshot.val();
            if (ratings) {
                const ratingValues = Object.values(ratings);
                const totalRating = ratingValues.reduce((sum, r) => sum + r.rating, 0);
                const averageRating = totalRating / ratingValues.length;
                
                database.ref(`products/${productId}`).update({
                    averageRating: averageRating,
                    totalRatings: ratingValues.length
                });
            }
        });
}

function loadProductReviews(productId) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;
    
    database.ref(`products/${productId}/ratings`).orderByChild('timestamp').once('value')
        .then((snapshot) => {
            reviewsContainer.innerHTML = '';
            if (snapshot.exists()) {
                const reviews = [];
                snapshot.forEach((childSnapshot) => {
                    reviews.unshift({ id: childSnapshot.key, ...childSnapshot.val() });
                });
                
                reviews.forEach(review => {
                    const reviewElement = document.createElement('div');
                    reviewElement.className = 'review-item';
                    reviewElement.innerHTML = `
                        <div class="review-header">
                            <div class="review-rating">${generateRatingStars(review.rating)}</div>
                            <div class="review-author">${review.userName}</div>
                            <div class="review-date">${new Date(review.timestamp).toLocaleDateString()}</div>
                        </div>
                        ${review.review ? `<div class="review-text">${review.review}</div>` : ''}
                    `;
                    reviewsContainer.appendChild(reviewElement);
                });
            } else {
                reviewsContainer.innerHTML = '<p>No reviews yet. Be the first to review this product!</p>';
            }
        });
}

function loadRecommendedProducts(category, currentProductId) {
    const recommendedContainer = document.getElementById('recommendedProducts');
    if (!recommendedContainer) return;
    
    database.ref('products').orderByChild('category').equalTo(category).limitToFirst(6).once('value')
        .then((snapshot) => {
            recommendedContainer.innerHTML = '';
            const products = [];
            snapshot.forEach((childSnapshot) => {
                const product = { id: childSnapshot.key, ...childSnapshot.val() };
                if (product.id !== currentProductId) {
                    products.push(product);
                }
            });
            
            products.slice(0, 4).forEach(product => {
                const productElement = document.createElement('div');
                productElement.className = 'recommended-product';
                productElement.onclick = () => openProductPage(product);
                productElement.innerHTML = `
                    <img src="${product.images[0]}" alt="${product.title}">
                    <div class="recommended-product-info">
                        <div class="recommended-product-title">${product.title}</div>
                        <div class="recommended-product-price">₹${product.price}</div>
                    </div>
                `;
                recommendedContainer.appendChild(productElement);
            });
        });
}

// Return/Refund Functions
function openReturnForm(orderId) {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    // Get the order details
    database.ref(`orders/${orderId}`).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const order = { id: snapshot.key, ...snapshot.val() };
                
                // Check if order is delivered and within return window
                if (order.status === 'delivered' && isWithinReturnWindow(order.deliveredAt)) {
                    showReturnForm(order);
                } else if (order.status === 'delivered') {
                    showNotification('Return window has expired. Returns are only allowed within 24 hours of delivery.', 'error');
                } else {
                    showNotification('This order cannot be returned yet.', 'error');
                }
            } else {
                showNotification('Order not found', 'error');
            }
        })
        .catch((error) => {
            showNotification('Error loading order details', 'error');
        });
}

function showReturnForm(order) {
    const returnForm = document.createElement('div');
    returnForm.className = 'return-form-modal';
    returnForm.innerHTML = `
        <div class="return-form">
            <div class="return-form-header">
                <h3>Return Order</h3>
                <button onclick="closeReturnForm()" class="close-btn">&times;</button>
            </div>
            <form id="returnForm">
                <div class="form-group">
                    <label>Order ID</label>
                    <input type="text" value="Order #${order.id.slice(-6)}" readonly>
                </div>
                <div class="form-group">
                    <label>Order Total</label>
                    <input type="text" value="₹${order.grandTotal || order.total}" readonly>
                </div>
                <div class="form-group">
                    <label>Reason for Return *</label>
                    <select id="returnReason" required>
                        <option value="">Select a reason</option>
                        <option value="defective">Product is defective</option>
                        <option value="wrong_item">Wrong item received</option>
                        <option value="damaged">Product damaged during delivery</option>
                        <option value="not_as_described">Product not as described</option>
                        <option value="size_issue">Size/fit issue</option>
                        <option value="other">Other reason</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Additional Details</label>
                    <textarea id="returnDetails" placeholder="Please provide more details about the issue..." rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>UPI ID for Refund *</label>
                    <input type="text" id="upiId" placeholder="Enter your UPI ID (e.g., 1234567890@upi)" required>
                </div>
                <div class="form-group">
                    <label>Mobile Number</label>
                    <input type="tel" id="returnMobile" placeholder="Enter mobile number for refund updates" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="submit-return-btn">Submit Return Request</button>
                    <button type="button" onclick="closeReturnForm()" class="cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(returnForm);
    
    // Add form submission handler
    document.getElementById('returnForm').addEventListener('submit', (e) => {
        e.preventDefault();
        submitReturnRequest(order);
    });
}

function submitReturnRequest(order) {
    const reason = document.getElementById('returnReason').value;
    const details = document.getElementById('returnDetails').value;
    const upiId = document.getElementById('upiId').value;
    const mobile = document.getElementById('returnMobile').value;
    
    if (!reason || !upiId || !mobile) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    const returnData = {
        orderId: order.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        orderTotal: order.grandTotal || order.total,
        reason: reason,
        details: details,
        upiId: upiId,
        mobile: mobile,
        status: 'pending',
        createdAt: Date.now()
    };
    
    console.log('Submitting return request:', returnData);
    
    database.ref('returns').push(returnData)
        .then((ref) => {
            console.log('Return request submitted successfully with ID:', ref.key);
            showNotification('Return request submitted successfully!', 'success');
            closeReturnForm();
            loadOrders(); // Refresh the orders list
        })
        .catch((error) => {
            console.error('Error submitting return request:', error);
            showNotification('Error submitting return request', 'error');
        });
}

function closeReturnForm() {
    const returnForm = document.querySelector('.return-form-modal');
    if (returnForm) {
        returnForm.remove();
    }
}

// Policy Pages Functions
function loadPolicyPage(policyType) {
    hideAllPages();
    
    let policyPage = document.querySelector('.policy-page');
    if (!policyPage) {
        policyPage = document.createElement('div');
        policyPage.className = 'policy-page';
        document.body.appendChild(policyPage);
    }
    
    const policies = {
        return: {
            title: 'Return Policy',
            content: `
                <h2>Return Policy</h2>
                <p>We want you to be completely satisfied with your purchase. If you're not happy with your order, you can return it within 24 hours of delivery.</p>
                
                <h3>Return Conditions:</h3>
                <ul>
                    <li>Product must be in original condition</li>
                    <li>All original packaging and tags must be intact</li>
                    <li>Product must not be used or damaged</li>
                    <li>Return request must be submitted within 24 hours of delivery</li>
                </ul>
                
                <h3>Return Process:</h3>
                <ol>
                    <li>Go to "My Orders" in your profile</li>
                    <li>Click "Return Order" button for delivered orders</li>
                    <li>Provide reason for return and UPI ID for refund</li>
                    <li>Wait for approval from our team</li>
                    <li>Return will be processed and refund issued</li>
                </ol>
                
                <h3>Non-Returnable Items:</h3>
                <ul>
                    <li>Personal care items</li>
                    <li>Underwear and innerwear</li>
                    <li>Sale/discounted items</li>
                    <li>Customized products</li>
                </ul>
                
                <h3>Important Notes:</h3>
                <ul>
                    <li>Returns are only allowed for orders with "Delivered" status</li>
                    <li>The 24-hour return window starts from the delivery timestamp</li>
                    <li>After 24 hours, returns cannot be processed</li>
                </ul>
            `
        },
        refund: {
            title: 'Refund Policy',
            content: `
                <h2>Refund Policy</h2>
                <p>We process refunds within 3-5 business days after return approval.</p>
                
                <h3>Refund Methods:</h3>
                <ul>
                    <li>UPI Transfer (Primary method)</li>
                    <li>Bank Transfer (Alternative method)</li>
                </ul>
                
                <h3>Refund Timeline:</h3>
                <ul>
                    <li>Return approval: 1-2 business days</li>
                    <li>Refund processing: 3-5 business days</li>
                    <li>Total time: 4-7 business days</li>
                </ul>
                
                <h3>Refund Amount:</h3>
                <ul>
                    <li>Full product price refunded</li>
                    <li>Shipping charges are non-refundable</li>
                    <li>Return shipping costs borne by customer</li>
                </ul>
                
                <h3>Return Window:</h3>
                <ul>
                    <li>Returns must be requested within 24 hours of delivery</li>
                    <li>Late return requests will not be processed</li>
                    <li>Ensure timely submission for faster processing</li>
                </ul>
            `
        },
        privacy: {
            title: 'Privacy Policy',
            content: `
                <h2>Privacy Policy</h2>
                <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
                
                <h3>Information We Collect:</h3>
                <ul>
                    <li>Name, email, and mobile number</li>
                    <li>Delivery addresses</li>
                    <li>Order history and preferences</li>
                    <li>Payment information (securely processed)</li>
                </ul>
                
                <h3>How We Use Your Information:</h3>
                <ul>
                    <li>Process and fulfill your orders</li>
                    <li>Communicate order updates</li>
                    <li>Provide customer support</li>
                    <li>Improve our services</li>
                </ul>
                
                <h3>Data Protection:</h3>
                <ul>
                    <li>All data is encrypted and secure</li>
                    <li>We never share your personal information</li>
                    <li>You can request data deletion anytime</li>
                </ul>
            `
        },
        disclaimer: {
            title: 'Disclaimer',
            content: `
                <h2>Disclaimer</h2>
                <p>Please read this disclaimer carefully before using our services.</p>
                
                <h3>Product Information:</h3>
                <ul>
                    <li>Product images are for representation only</li>
                    <li>Actual colors may vary slightly</li>
                    <li>Product specifications subject to change</li>
                    <li>We strive for accuracy but errors may occur</li>
                </ul>
                
                <h3>Service Availability:</h3>
                <ul>
                    <li>Services subject to availability</li>
                    <li>We reserve the right to modify services</li>
                    <li>Technical issues may cause temporary disruptions</li>
                </ul>
                
                <h3>Limitation of Liability:</h3>
                <ul>
                    <li>We are not liable for indirect damages</li>
                    <li>Maximum liability limited to order value</li>
                    <li>Force majeure events excluded</li>
                </ul>
            `
        },
        about: {
            title: 'About & Contact',
            content: `
                <h2>About Curio Market</h2>
                <p>Curio Market is your one-stop destination for unique and curated products. We bring you the best selection of items that add value to your lifestyle.</p>
                
                <h3>Our Mission:</h3>
                <p>To provide high-quality, unique products with exceptional customer service and a seamless shopping experience.</p>
                
                <h3>Contact Information:</h3>
                <ul>
                    <li><strong>Email:</strong> support@curiomarket.com</li>
                    <li><strong>Phone:</strong> +91 9954996028</li>
                    <li><strong>Address:</strong> 123 Market Street, City, State - 123456</li>
                    <li><strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM</li>
                </ul>
                
                <h3>Customer Support:</h3>
                <ul>
                    <li>24/7 online support</li>
                    <li>WhatsApp support: +91 9954996028</li>
                    <li>Response time: Within 2 hours</li>
                </ul>
                
                <h3>Follow Us:</h3>
                <div class="social-links">
                    <a href="#" class="social-link"><i class="fab fa-facebook"></i> Facebook</a>
                    <a href="#" class="social-link"><i class="fab fa-instagram"></i> Instagram</a>
                    <a href="#" class="social-link"><i class="fab fa-twitter"></i> Twitter</a>
                </div>
            `
        }
    };
    
    const policy = policies[policyType];
    
    policyPage.innerHTML = `
        <div class="policy-content">
            <div class="policy-header">
                <button class="back-btn" onclick="navigateTo('profile')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h1>${policy.title}</h1>
            </div>
            <div class="policy-body">
                ${policy.content}
            </div>
        </div>
    `;
    
    policyPage.style.display = 'block';
}

// Cart and Wishlist Functions
function addToCart(productId) {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    const quantity = document.getElementById('quantityInput') ? parseInt(document.getElementById('quantityInput').value) : 1;
    
    database.ref(`products/${productId}`).once('value')
        .then((snapshot) => {
            const product = snapshot.val();
            if (product) {
                const cartItem = {
                    id: productId,
                    title: product.title,
                    price: product.price,
                    image: product.images[0],
                    quantity: quantity
                };
                
                const existingIndex = cart.findIndex(item => item.id === productId);
                if (existingIndex >= 0) {
                    cart[existingIndex].quantity += quantity;
                } else {
                    cart.push(cartItem);
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                showNotification('Added to cart!', 'success');
            }
        });
}

function buyNow(productId) {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    const quantity = document.getElementById('quantityInput') ? parseInt(document.getElementById('quantityInput').value) : 1;
    
    database.ref(`products/${productId}`).once('value')
        .then((snapshot) => {
            const product = snapshot.val();
            if (product) {
                // Get shipping charge
                return database.ref('settings/shippingCharge').once('value').then((shippingSnapshot) => {
                    const shippingCharge = shippingSnapshot.val() || 0;
                    currentOrder = {
                        products: [{
                            id: productId,
                            title: product.title,
                            price: product.price,
                            image: product.images[0],
                            quantity: quantity
                        }],
                        total: product.price * quantity,
                        shippingCharge: shippingCharge,
                        grandTotal: (product.price * quantity) + shippingCharge
                    };
                    openOrderPage();
                });
            }
        });
}

// Order Page Functions
function openOrderPage() {
    hideAllPages();
    
    // Create order page if it doesn't exist
    let orderPage = document.querySelector('.order-page');
    if (!orderPage) {
        orderPage = document.createElement('div');
        orderPage.className = 'order-page';
        document.body.appendChild(orderPage);
    }
    
    orderPage.innerHTML = `
        <div class="order-form">
            <div class="order-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2>Delivery Details</h2>
            </div>
            
            <form id="orderForm">
                <div class="order-summary">
                    <h3>Order Summary</h3>
                    <div class="order-details">
                        <div class="order-item">
                            <span>Product Price:</span>
                            <span>₹${currentOrder.total}</span>
                        </div>
                        <div class="order-item">
                            <span>Shipping Charge:</span>
                            <span>₹${currentOrder.shippingCharge}</span>
                        </div>
                        <div class="order-item total">
                            <span>Total Amount:</span>
                            <span>₹${currentOrder.grandTotal}</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="fullName" required>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="phoneNumber" required>
                </div>
                <div class="form-group">
                    <label>Pincode</label>
                    <input type="text" id="pincode" required>
                </div>
                <div class="form-group">
                    <label>State</label>
                    <input type="text" id="state" required>
                </div>
                <div class="form-group">
                    <label>City</label>
                    <input type="text" id="city" required>
                </div>
                <div class="form-group">
                    <label>House No., Building Name</label>
                    <input type="text" id="houseNo" required>
                </div>
                <div class="form-group">
                    <label>Road Name, Area, Colony</label>
                    <textarea id="roadName" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="deliver-btn">Deliver Here</button>
                </div>
            </form>
        </div>
    `;
    
    orderPage.style.display = 'block';
    document.getElementById('orderForm').addEventListener('submit', handleOrderSubmit);
}

function handleOrderSubmit(e) {
    e.preventDefault();
    
    const orderData = {
        userId: currentUser.uid,
        products: currentOrder.products,
        total: currentOrder.total,
        shippingCharge: currentOrder.shippingCharge,
        grandTotal: currentOrder.grandTotal,
        deliveryDetails: {
            fullName: document.getElementById('fullName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            pincode: document.getElementById('pincode').value,
            state: document.getElementById('state').value,
            city: document.getElementById('city').value,
            houseNo: document.getElementById('houseNo').value,
            roadName: document.getElementById('roadName').value
        },
        status: 'pending',
        createdAt: Date.now()
    };
    
    database.ref('orders').push(orderData)
        .then((ref) => {
            currentOrder.orderId = ref.key;
            openPaymentPage();
        });
}

// Payment Page Functions
function openPaymentPage() {
    hideAllPages();
    
    // Create payment page if it doesn't exist
    let paymentPage = document.querySelector('.payment-page');
    if (!paymentPage) {
        paymentPage = document.createElement('div');
        paymentPage.className = 'payment-page';
        document.body.appendChild(paymentPage);
    }
    
    paymentPage.innerHTML = `
        <div class="payment-options">
            <h2>Payment Options</h2>
            <div class="payment-option" onclick="selectPayment('upi')">
                <h3>UPI Payment</h3>
                <p>Pay using UPI to: 9954996028@pthdfc</p>
                <div class="upi-details">
                    <p><strong>UPI ID:</strong> 9954996028@pthdfc</p>
                    <p>Once payment is done, your order will be confirmed.</p>
                </div>
            </div>
            <div class="payment-option" onclick="selectPayment('cod')">
                <h3>Cash on Delivery</h3>
                <p>Pay when you receive your order</p>
            </div>
            <button class="confirm-btn" onclick="confirmOrder()" style="display: none;">Confirm Order</button>
        </div>
    `;
    
    paymentPage.style.display = 'block';
}

function selectPayment(method) {
    document.querySelectorAll('.payment-option').forEach(option => option.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    const confirmBtn = document.querySelector('.confirm-btn');
    confirmBtn.style.display = 'block';
    
    currentOrder.paymentMethod = method;
}

function confirmOrder() {
    if (!currentOrder.paymentMethod) {
        showNotification('Please select a payment method', 'error');
        return;
    }
    
    showLoading();
    
    const orderRef = database.ref(`orders/${currentOrder.orderId}`);
    orderRef.update({
        status: currentOrder.paymentMethod === 'cod' ? 'confirmed' : 'pending',
        paymentMethod: currentOrder.paymentMethod
    })
    .then(() => {
        hideLoading();
        showNotification('Order confirmed successfully!', 'success');
        setTimeout(() => {
            navigateTo('home');
        }, 2000);
    })
    .catch((error) => {
        hideLoading();
        showNotification('Error confirming order', 'error');
    });
}

// Search Functions
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        navigateTo('search');
        performSearch(query);
    }
}

function loadSearchPage() {
    hideAllPages();
    
    // Create search page if it doesn't exist
    let searchPage = document.querySelector('.search-results');
    if (!searchPage) {
        searchPage = document.createElement('div');
        searchPage.className = 'search-results';
        searchPage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2>Search Results</h2>
            </div>
            <div id="searchResults" class="products-grid"></div>
        `;
        document.body.appendChild(searchPage);
    }
    
    searchPage.style.display = 'block';
}

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<p>Searching...</p>';
    
    database.ref('products').once('value')
        .then((snapshot) => {
            const products = [];
            const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 0);
            
            snapshot.forEach((childSnapshot) => {
                const product = { id: childSnapshot.key, ...childSnapshot.val() };
                const productText = `${product.title} ${product.category} ${product.description || ''}`.toLowerCase();
                
                // Check if at least 3-4 words match
                let matchCount = 0;
                queryWords.forEach(word => {
                    if (productText.includes(word)) {
                        matchCount++;
                    }
                });
                
                // Show results if at least 1 word matches or if query is short
                if (matchCount >= 1 || queryWords.length <= 2) {
                    products.push({
                        ...product,
                        matchScore: matchCount / queryWords.length
                    });
                }
            });
            
            // Sort by relevance (match score)
            products.sort((a, b) => b.matchScore - a.matchScore);
            
            resultsContainer.innerHTML = '';
            if (products.length === 0) {
                resultsContainer.innerHTML = '<p>No products found</p>';
            } else {
                products.forEach(product => {
                    resultsContainer.appendChild(createProductCard(product));
                });
            }
        });
}

// Wishlist Functions
function loadWishlistPage() {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    hideAllPages();
    
    // Create wishlist page if it doesn't exist
    let wishlistPage = document.querySelector('.wishlist-page');
    if (!wishlistPage) {
        wishlistPage = document.createElement('div');
        wishlistPage.className = 'wishlist-page';
        wishlistPage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2>My Wishlist</h2>
            </div>
            <div id="wishlistContainer" class="products-grid"></div>
        `;
        document.body.appendChild(wishlistPage);
    }
    
    wishlistPage.style.display = 'block';
    loadWishlistItems();
}

function loadWishlistItems() {
    const container = document.getElementById('wishlistContainer');
    
    if (wishlist.length === 0) {
        container.innerHTML = '<p>Your wishlist is empty</p>';
        return;
    }
    
    container.innerHTML = '';
    wishlist.forEach(productId => {
        database.ref(`products/${productId}`).once('value')
            .then((snapshot) => {
                const product = snapshot.val();
                if (product) {
                    container.appendChild(createProductCard({ id: productId, ...product }));
                }
            });
    });
}

// Cart Functions
function loadCartPage() {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    hideAllPages();
    
    // Create cart page if it doesn't exist
    let cartPage = document.querySelector('.cart-page');
    if (!cartPage) {
        cartPage = document.createElement('div');
        cartPage.className = 'cart-page';
        cartPage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2>My Cart</h2>
            </div>
            <div id="cartContainer"></div>
            <div class="cart-total">
                <h3>Total: ₹<span id="cartTotal">0</span></h3>
                <button class="action-btn-large buy-now-btn" onclick="checkoutCart()">Buy Now</button>
            </div>
        `;
        document.body.appendChild(cartPage);
    }
    
    cartPage.style.display = 'block';
    loadCartItems();
}

function loadCartItems() {
    const container = document.getElementById('cartContainer');
    const totalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty</p>';
        totalElement.textContent = '0';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="product-image">
            <div class="item-details">
                <div class="product-title">${item.title}</div>
                <div class="product-price">₹${item.price}</div>
                <div class="quantity-selector">
                    <button onclick="updateCartQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', 1)">+</button>
                </div>
                <button onclick="removeFromCart('${item.id}')" class="remove-btn">Remove</button>
            </div>
        `;
        container.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    totalElement.textContent = total;
}

function updateCartQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = Math.max(1, item.quantity + delta);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
}

function checkoutCart() {
    if (cart.length === 0) {
        showNotification('Cart is empty', 'error');
        return;
    }
    
    currentOrder = {
        products: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    openOrderPage();
}

// Profile Functions
function loadProfilePage() {
    hideAllPages();
    
    // Create profile page if it doesn't exist
    let profilePage = document.querySelector('.profile-page');
    if (!profilePage) {
        profilePage = document.createElement('div');
        profilePage.className = 'profile-page';
        document.body.appendChild(profilePage);
    }
    
    if (!currentUser) {
        // Show login/signup options for non-logged in users
        profilePage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-info">
                    <h2>Welcome Guest</h2>
                    <p>Please login to access your profile</p>
                </div>
            </div>
            
            <div class="profile-menu">
                <div class="menu-item" onclick="showModal(loginModal)">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>Login</span>
                </div>
                <div class="menu-item" onclick="showModal(registerModal)">
                    <i class="fas fa-user-plus"></i>
                    <span>Sign Up</span>
                </div>
            </div>
        `;
    } else {
        // Show profile options for logged in users
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        profilePage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('home')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
            </div>
            <div class="profile-header">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-info">
                    <h2>${userData.name || 'User'}</h2>
                    <p>${userData.email || currentUser.email}</p>
                </div>
            </div>
            
            <div class="profile-menu">
                <div class="menu-item" onclick="loadOrders()">
                    <i class="fas fa-shopping-bag"></i>
                    <span>My Orders</span>
                </div>
                <div class="menu-item" onclick="navigateTo('wishlist')">
                    <i class="fas fa-heart"></i>
                    <span>Wishlist</span>
                </div>
                            <div class="menu-item" onclick="loadSavedAddresses()">
                <i class="fas fa-map-marker-alt"></i>
                <span>Saved Addresses</span>
            </div>
            <div class="menu-item" onclick="loadPolicyPage('return')">
                <i class="fas fa-undo"></i>
                <span>Return Policy</span>
            </div>
            <div class="menu-item" onclick="loadPolicyPage('refund')">
                <i class="fas fa-money-bill-wave"></i>
                <span>Refund Policy</span>
            </div>
            <div class="menu-item" onclick="loadPolicyPage('privacy')">
                <i class="fas fa-shield-alt"></i>
                <span>Privacy Policy</span>
            </div>
            <div class="menu-item" onclick="loadPolicyPage('disclaimer')">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Disclaimer</span>
            </div>
            <div class="menu-item" onclick="loadPolicyPage('about')">
                <i class="fas fa-info-circle"></i>
                <span>About & Contact</span>
            </div>
            <div class="menu-item" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </div>
        </div>
    `;
    }
    
    profilePage.style.display = 'block';
}

// Missing Functions
function loadOrders() {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    hideAllPages();
    
    // Create orders page if it doesn't exist
    let ordersPage = document.querySelector('.orders-page');
    if (!ordersPage) {
        ordersPage = document.createElement('div');
        ordersPage.className = 'orders-page';
        ordersPage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('profile')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2>My Orders</h2>
            </div>
            <div id="ordersContainer"></div>
        `;
        document.body.appendChild(ordersPage);
    }
    
    ordersPage.style.display = 'block';
    
    // Clean up any existing listeners
    if (window.returnStatusListener) {
        window.returnStatusListener.off();
        window.returnStatusListener = null;
    }
    
    // Load user orders from Firebase
    const ordersContainer = document.getElementById('ordersContainer');
    ordersContainer.innerHTML = '<p>Loading orders...</p>';
    
    database.ref('orders').orderByChild('userId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const orders = [];
                snapshot.forEach((childSnapshot) => {
                    orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
                });
                
                // Load return requests for all orders
                loadReturnRequestsForOrders(orders, ordersContainer);
            } else {
                ordersContainer.innerHTML = '<p>No orders found</p>';
            }
        })
        .catch((error) => {
            ordersContainer.innerHTML = '<p>Error loading orders</p>';
            console.error('Error loading orders:', error);
        });
}

function loadReturnRequestsForOrders(orders, ordersContainer) {
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<p>No orders found</p>';
        return;
    }
    
    console.log('Loading return requests for orders:', orders.map(o => o.id));
    
    // Get all return requests for the current user
    database.ref('returns').orderByChild('userId').equalTo(currentUser.uid).once('value')
        .then((returnsSnapshot) => {
            const returns = {};
            if (returnsSnapshot.exists()) {
                returnsSnapshot.forEach((childSnapshot) => {
                    const returnRequest = childSnapshot.val();
                    returns[returnRequest.orderId] = returnRequest;
                    console.log('Found return request for order:', returnRequest.orderId, 'with status:', returnRequest.status);
                });
            }
            
            console.log('All return requests:', returns);
            
            // Attach return requests to orders and create order elements
            ordersContainer.innerHTML = '';
            orders.forEach(order => {
                if (returns[order.id]) {
                    order.returnRequest = returns[order.id];
                    console.log('Attached return request to order:', order.id, 'status:', returns[order.id].status);
                }
                const orderElement = createOrderElement(order);
                ordersContainer.appendChild(orderElement);
            });
            
            // Set up real-time listener for return status changes
            setupReturnStatusListener(ordersContainer);
        })
        .catch((error) => {
            console.error('Error loading return requests:', error);
            // If there's an error loading returns, still show orders without return info
            ordersContainer.innerHTML = '';
            orders.forEach(order => {
                const orderElement = createOrderElement(order);
                ordersContainer.appendChild(orderElement);
            });
        });
}

function setupReturnStatusListener(ordersContainer) {
    console.log('Setting up return status listener for user:', currentUser?.uid);
    
    // Listen for changes in return requests for the current user
    const listener = database.ref('returns').orderByChild('userId').equalTo(currentUser.uid).on('value', (snapshot) => {
        console.log('Return status update received:', snapshot.val());
        
        const returns = {};
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                const returnRequest = childSnapshot.val();
                returns[returnRequest.orderId] = returnRequest;
            });
        }
        
        console.log('Processed returns:', returns);
        
        // Update order elements with new return status
        const orderElements = ordersContainer.querySelectorAll('.order-item');
        console.log('Found order elements:', orderElements.length);
        
        orderElements.forEach((orderElement, index) => {
            // Get order ID from the order element (stored as data attribute)
            const orderId = orderElement.getAttribute('data-order-id');
            if (!orderId) {
                console.warn(`Order element ${index} has no data-order-id attribute`);
                return;
            }
            
            console.log(`Processing order ${index + 1}:`, orderId, 'with returns:', returns);
            
            const returnStatusElement = orderElement.querySelector('.return-status-display');
            const returnBtn = orderElement.querySelector('.return-btn');
            
            if (returns[orderId]) {
                console.log(`Order ${orderId} has return request with status:`, returns[orderId].status);
                
                // Update existing return status or add new one
                if (returnStatusElement) {
                    // Check if status changed and show notification
                    const oldStatus = returnStatusElement.className.match(/return-status-display\s+(\w+)/)?.[1];
                    const newStatus = returns[orderId].status;
                    
                    console.log('Status change detected:', oldStatus, '->', newStatus);
                    
                    if (oldStatus && oldStatus !== newStatus) {
                        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                        showNotification(`Return status updated to: ${statusText}`, 'success');
                    }
                    
                    // Update existing status
                    const statusClass = returns[orderId].status;
                    const statusText = returns[orderId].status.charAt(0).toUpperCase() + returns[orderId].status.slice(1);
                    returnStatusElement.className = `return-status-display ${statusClass}`;
                    returnStatusElement.innerHTML = `
                        <i class="fas fa-undo"></i> Return Status: ${statusText}
                        <i class="fas fa-info-circle info-icon"></i>
                    `;
                    returnStatusElement.onclick = () => showReturnDetails(orderId);
                } else {
                    console.log(`Adding new return status for order ${orderId}`);
                    
                    // Add new return status
                    const returnStatusDisplay = document.createElement('div');
                    const statusClass = returns[orderId].status;
                    const statusText = returns[orderId].status.charAt(0).toUpperCase() + returns[orderId].status.slice(1);
                    returnStatusDisplay.className = `return-status-display ${statusClass}`;
                    returnStatusDisplay.onclick = () => showReturnDetails(orderId);
                    returnStatusDisplay.innerHTML = `
                        <i class="fas fa-undo"></i> Return Status: ${statusText}
                        <i class="fas fa-info-circle info-icon"></i>
                    `;
                    
                    // Insert after order details
                    const orderDetails = orderElement.querySelector('.order-details');
                    if (orderDetails) {
                        orderDetails.parentNode.insertBefore(returnStatusDisplay, orderDetails.nextSibling);
                        console.log(`Return status display added for order ${orderId}`);
                    } else {
                        console.error(`Order details not found for order ${orderId}`);
                    }
                    
                    // Remove return button if it exists
                    if (returnBtn) {
                        returnBtn.remove();
                        console.log(`Return button removed for order ${orderId}`);
                    }
                }
            } else if (returnStatusElement) {
                console.log(`Removing return status for order ${orderId} (no return request)`);
                // Remove return status if no return request exists
                returnStatusElement.remove();
            }
        });
    }, (error) => {
        console.error('Error in return status listener:', error);
    });
    
    // Store the listener reference for cleanup
    window.returnStatusListener = listener;
    console.log('Return status listener set up successfully');
}

function showReturnDetails(orderId) {
    // Find the order and its return request
    const orderElement = document.querySelector(`[onclick*="${orderId}"]`)?.closest('.order-item');
    if (!orderElement) return;
    
    // Get the return request data from the order element
    const returnStatusElement = orderElement.querySelector('.return-status-display');
    if (!returnStatusElement) return;
    
    // Find the order in the current orders list
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    // Get return details from Firebase
    database.ref('returns').orderByChild('orderId').equalTo(orderId).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const returnRequest = Object.values(snapshot.val())[0];
                showReturnDetailsModal(returnRequest);
            }
        })
        .catch((error) => {
            console.error('Error loading return details:', error);
            showNotification('Error loading return details', 'error');
        });
}

function showReturnDetailsModal(returnRequest) {
    const modal = document.createElement('div');
    modal.className = 'return-details-modal';
    
    const statusClass = returnRequest.status;
    const statusText = returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1);
    
    modal.innerHTML = `
        <div class="return-details-content">
            <div class="return-details-header">
                <h3>Return Request Details</h3>
                <button onclick="closeReturnDetailsModal()" class="close-btn">&times;</button>
            </div>
            <div class="return-details-body">
                <div class="return-status-badge ${statusClass}">
                    <i class="fas fa-undo"></i> Status: ${statusText}
                </div>
                <div class="return-info-grid">
                    <div class="return-info-item">
                        <strong>Order ID:</strong> #${returnRequest.orderId.slice(-6)}
                    </div>
                    <div class="return-info-item">
                        <strong>Request Date:</strong> ${new Date(returnRequest.createdAt).toLocaleDateString()}
                    </div>
                    <div class="return-info-item">
                        <strong>Reason:</strong> ${returnRequest.reason}
                    </div>
                    <div class="return-info-item">
                        <strong>UPI ID:</strong> ${returnRequest.upiId}
                    </div>
                    <div class="return-info-item">
                        <strong>Mobile:</strong> ${returnRequest.mobile}
                    </div>
                    ${returnRequest.details ? `<div class="return-info-item full-width">
                        <strong>Additional Details:</strong><br>
                        ${returnRequest.details}
                    </div>` : ''}
                </div>
                <div class="return-notes">
                    <p><strong>Note:</strong> Your return request is being reviewed by our team. You will be notified once the status is updated.</p>
                </div>
            </div>
            <div class="return-details-actions">
                <button onclick="closeReturnDetailsModal()" class="close-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeReturnDetailsModal() {
    const modal = document.querySelector('.return-details-modal');
    if (modal) {
        modal.remove();
    }
}



function createOrderElement(order) {
    const orderElement = document.createElement('div');
    orderElement.className = 'order-item';
    orderElement.setAttribute('data-order-id', order.id); // Add data attribute for order ID
    
    // Check if order can be cancelled or returned
    const canCancel = order.status === 'pending' || order.status === 'confirmed';
    const canReturn = order.status === 'delivered' && isWithinReturnWindow(order.deliveredAt);
    
    // Calculate time remaining for return (if applicable)
    let returnTimeRemaining = '';
    if (order.status === 'delivered' && order.deliveredAt) {
        const returnDeadline = order.deliveredAt + (24 * 60 * 60 * 1000); // 24 hours
        const now = Date.now();
        if (now < returnDeadline) {
            const remaining = returnDeadline - now;
            const hours = Math.floor(remaining / (60 * 60 * 1000));
            const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
            returnTimeRemaining = `${hours}h ${minutes}m remaining`;
        }
    }
    
    // Check if there's an existing return request for this order
    let returnStatusDisplay = '';
    if (order.returnRequest) {
        const statusClass = order.returnRequest.status;
        const statusText = order.returnRequest.status.charAt(0).toUpperCase() + order.returnRequest.status.slice(1);
        returnStatusDisplay = `<div class="return-status-display ${statusClass}" onclick="showReturnDetails('${order.id}')">
            <i class="fas fa-undo"></i> Return Status: ${statusText}
            <i class="fas fa-info-circle info-icon"></i>
        </div>`;
        // Hide the return window timer if a return request has already been submitted
        returnTimeRemaining = '';
    }
    
    orderElement.innerHTML = `
        <div class="order-header">
            <h3>Order #${order.id.slice(-6)}</h3>
            <span class="order-status ${order.status}">${order.status}</span>
        </div>
        <div class="order-details">
            <p><strong>Total:</strong> ₹${order.grandTotal || order.total}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            ${order.deliveredAt ? `<p><strong>Delivered:</strong> ${new Date(order.deliveredAt).toLocaleDateString()}</p>` : ''}
            ${returnTimeRemaining ? `<p class="return-timer"><strong>Return Window:</strong> ${returnTimeRemaining}</p>` : ''}
        </div>
        ${returnStatusDisplay}
        <div class="order-actions">
            ${canCancel ? `<button class="cancel-btn" onclick="cancelOrder('${order.id}')">Cancel Order</button>` : ''}
            ${canReturn && !order.returnRequest ? `<button class="return-btn" onclick="openReturnForm('${order.id}')">Return Order</button>` : ''}
        </div>
    `;
    
    return orderElement;
}

function isWithinReturnWindow(deliveredAt) {
    if (!deliveredAt) {
        return false;
    }
    const returnDeadline = deliveredAt + (24 * 60 * 60 * 1000); // 24 hours
    return Date.now() < returnDeadline;
}

function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }
    
    showLoading();
    
    database.ref(`orders/${orderId}`).update({
        status: 'cancelled',
        cancelledAt: Date.now()
    })
    .then(() => {
        hideLoading();
        showNotification('Order cancelled successfully!', 'success');
        loadOrders(); // Refresh the orders list
    })
    .catch((error) => {
        hideLoading();
        showNotification('Error cancelling order: ' + error.message, 'error');
    });
}

function loadSavedAddresses() {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    hideAllPages();
    
    // Create addresses page if it doesn't exist
    let addressesPage = document.querySelector('.addresses-page');
    if (!addressesPage) {
        addressesPage = document.createElement('div');
        addressesPage.className = 'addresses-page';
        addressesPage.innerHTML = `
            <div class="page-header">
                <button class="back-btn" onclick="navigateTo('profile')">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <h2>Saved Addresses</h2>
            </div>
            <div id="addressesContainer"></div>
            <button class="action-btn-large" onclick="addNewAddress()">Add New Address</button>
        `;
        document.body.appendChild(addressesPage);
    }
    
    addressesPage.style.display = 'block';
    
    // Load saved addresses from localStorage
    const addressesContainer = document.getElementById('addressesContainer');
    const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    
    if (savedAddresses.length === 0) {
        addressesContainer.innerHTML = '<p>No saved addresses</p>';
    } else {
        addressesContainer.innerHTML = '';
        savedAddresses.forEach((address, index) => {
            const addressElement = document.createElement('div');
            addressElement.className = 'address-item';
            addressElement.innerHTML = `
                <div class="address-details">
                    <h3>${address.fullName}</h3>
                    <p>${address.houseNo}, ${address.roadName}</p>
                    <p>${address.city}, ${address.state} - ${address.pincode}</p>
                    <p>Phone: ${address.phoneNumber}</p>
                </div>
                <div class="address-actions">
                    <button onclick="editSavedAddress(${index})">Edit</button>
                    <button onclick="deleteAddress(${index})">Delete</button>
                </div>
            `;
            addressesContainer.appendChild(addressElement);
        });
    }
}

function addNewAddress() {
    // Create add address form
    const addForm = document.createElement('div');
    addForm.className = 'edit-address-form';
    addForm.innerHTML = `
        <div class="edit-address-modal">
            <h3>Add New Address</h3>
            <form id="addAddressForm">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="addFullName" required>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="addPhoneNumber" required>
                </div>
                <div class="form-group">
                    <label>Pincode</label>
                    <input type="text" id="addPincode" required>
                </div>
                <div class="form-group">
                    <label>State</label>
                    <input type="text" id="addState" required>
                </div>
                <div class="form-group">
                    <label>City</label>
                    <input type="text" id="addCity" required>
                </div>
                <div class="form-group">
                    <label>House No., Building Name</label>
                    <input type="text" id="addHouseNo" required>
                </div>
                <div class="form-group">
                    <label>Road Name, Area, Colony</label>
                    <textarea id="addRoadName" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit">Add Address</button>
                    <button type="button" onclick="closeAddAddressForm()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(addForm);
    
    document.getElementById('addAddressForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newAddress = {
            fullName: document.getElementById('addFullName').value,
            phoneNumber: document.getElementById('addPhoneNumber').value,
            pincode: document.getElementById('addPincode').value,
            state: document.getElementById('addState').value,
            city: document.getElementById('addCity').value,
            houseNo: document.getElementById('addHouseNo').value,
            roadName: document.getElementById('addRoadName').value
        };
        
        const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
        savedAddresses.push(newAddress);
        localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
        
        showNotification('Address added successfully!', 'success');
        closeAddAddressForm();
        loadSavedAddresses(); // Refresh the addresses list
    });
}

function closeAddAddressForm() {
    const addForm = document.querySelector('.edit-address-form');
    if (addForm) {
        addForm.remove();
    }
}

function editAddress(index) {
    showNotification('Edit address feature coming soon!', 'info');
}

function deleteAddress(index) {
    const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    savedAddresses.splice(index, 1);
    localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
    loadSavedAddresses();
}

// Utility Functions
function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
    }
}

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
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function changeSlide(direction) {
    const slider = document.getElementById('slider');
    const slides = slider.children;
    const currentIndex = Math.abs(parseInt(slider.style.transform.replace('translateX(', '').replace('%)', '') || 0) / 100);
    const newIndex = Math.max(0, Math.min(slides.length - 1, currentIndex - direction));
    
    slider.style.transform = `translateX(-${newIndex * 100}%)`;
}

// Auto-slide functionality
setInterval(() => {
    const slider = document.getElementById('slider');
    const slides = slider.children;
    if (slides.length > 1) {
        const currentIndex = Math.abs(parseInt(slider.style.transform.replace('translateX(', '').replace('%)', '') || 0) / 100);
        const newIndex = (currentIndex + 1) % slides.length;
        slider.style.transform = `translateX(-${newIndex * 100}%)`;
    }
}, 5000);

// Additional utility functions
function showRegisterForm() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'block';
}

function showLoginForm() {
    registerModal.style.display = 'none';
    loginModal.style.display = 'block';
    document.getElementById('forgotPasswordModal').style.display = 'none';
}

function showForgotPasswordForm() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
    document.getElementById('forgotPasswordModal').style.display = 'block';
}

function viewAllProducts(type) {
    // This could navigate to a dedicated products page
    showNotification('View all products feature coming soon!', 'info');
}

// Wishlist and Share Functions
function toggleWishlist(productId) {
    if (!currentUser) {
        showModal(loginModal);
        return;
    }
    
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        showNotification('Removed from wishlist!', 'success');
    } else {
        wishlist.push(productId);
        showNotification('Added to wishlist!', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    
    // Update wishlist button appearance
    const wishlistBtn = document.querySelector('.wishlist-btn');
    if (wishlistBtn) {
        if (index > -1) {
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> Wishlist';
            wishlistBtn.classList.remove('active');
        } else {
            wishlistBtn.innerHTML = '<i class="fas fa-heart" style="color: red;"></i> Wishlisted';
            wishlistBtn.classList.add('active');
        }
    }
}

function shareProduct(productId) {
    if (navigator.share) {
        navigator.share({
            title: currentProduct.title,
            text: `Check out this product: ${currentProduct.title}`,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        const textToCopy = `${currentProduct.title} - ₹${currentProduct.price}\n${window.location.href}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showNotification('Product link copied to clipboard!', 'success');
        });
    }
}

// Address Management Functions

function editSavedAddress(index) {
    const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    const address = savedAddresses[index];
    
    // Create edit form
    const editForm = document.createElement('div');
    editForm.className = 'edit-address-form';
    editForm.innerHTML = `
        <div class="edit-address-modal">
            <h3>Edit Address</h3>
            <form id="editAddressForm">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="editFullName" value="${address.fullName}" required>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="editPhoneNumber" value="${address.phoneNumber}" required>
                </div>
                <div class="form-group">
                    <label>Pincode</label>
                    <input type="text" id="editPincode" value="${address.pincode}" required>
                </div>
                <div class="form-group">
                    <label>State</label>
                    <input type="text" id="editState" value="${address.state}" required>
                </div>
                <div class="form-group">
                    <label>City</label>
                    <input type="text" id="editCity" value="${address.city}" required>
                </div>
                <div class="form-group">
                    <label>House No., Building Name</label>
                    <input type="text" id="editHouseNo" value="${address.houseNo}" required>
                </div>
                <div class="form-group">
                    <label>Road Name, Area, Colony</label>
                    <textarea id="editRoadName" required>${address.roadName}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit">Save Changes</button>
                    <button type="button" onclick="closeEditAddressForm()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(editForm);
    
    document.getElementById('editAddressForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const updatedAddress = {
            fullName: document.getElementById('editFullName').value,
            phoneNumber: document.getElementById('editPhoneNumber').value,
            pincode: document.getElementById('editPincode').value,
            state: document.getElementById('editState').value,
            city: document.getElementById('editCity').value,
            houseNo: document.getElementById('editHouseNo').value,
            roadName: document.getElementById('editRoadName').value
        };
        
        savedAddresses[index] = updatedAddress;
        localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
        
        showNotification('Address updated successfully!', 'success');
        closeEditAddressForm();
        openOrderPage(); // Refresh the page
    });
}

function closeEditAddressForm() {
    const editForm = document.querySelector('.edit-address-form');
    if (editForm) {
        editForm.remove();
    }
}
