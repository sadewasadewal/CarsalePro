import { initializeFirebase, isFirebaseLive } from './config.js';
import { getCurrentUser, listenToAuthChanges, loginWithGoogle, loginMockUser, logoutUser, registerMockUser, loginMockUserEmail, registerFirebaseUser, loginFirebaseUser, isAdminUser } from './auth.js';
import { fetchAds, addAd, incrementAdViews, deleteAd, updateAdStatus } from './db.js';

// State Management
let currentUser = null;
let currentAds = [];
let uploadedImages = []; // Array of Base64 strings for the ad post form
let currentAdDetail = null; // Currently opened ad
let currentDetailImageIndex = 0; // Current image index in modal slider

// Filter Modal State Variables (Airbnb Style)
let activeCondition = "";
let activeTransmission = "";
let activeFuelType = "";
let activeNegotiable = "";
let filterModalInitialized = false;

// DOM Elements
const elements = {
    // Navigation & Tabs
    tabs: document.querySelectorAll('.nav-link'),
    tabContents: document.querySelectorAll('.tab-content'),
    navLogo: document.getElementById('nav-logo'),
    
    // Auth Header elements
    btnLoginHeader: document.getElementById('btn-login-header'),
    userProfileMenu: document.getElementById('user-profile-menu'),
    userAvatar: document.getElementById('user-avatar'),
    userNameDisplay: document.getElementById('user-name-display'),
    btnLogout: document.getElementById('btn-logout'),
    
    // Theme Toggle
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    
    // Mock Login Popup
    mockLoginModal: document.getElementById('mock-login-modal'),
    btnCloseMockLogin: document.getElementById('btn-close-mock-login'),
    mockUserSelect: document.getElementById('mock-user-select'),
    customMockFields: document.getElementById('custom-mock-fields'),
    mockUserName: document.getElementById('mock-user-name'),
    mockUserEmail: document.getElementById('mock-user-email'),
    btnSubmitMockLogin: document.getElementById('btn-submit-mock-login'),
    
    // Home View (listings & search)
    searchInput: document.getElementById('search-input'),
    filterMake: document.getElementById('filter-make'),
    filterLocation: document.getElementById('filter-location'),
    filterPrice: document.getElementById('filter-price'),
    filterNegotiable: document.getElementById('filter-negotiable'),
    adsContainer: document.getElementById('ads-container'),
    adsLoader: document.getElementById('ads-loader'),
    resultsCount: document.getElementById('results-count'),
    emptyState: document.getElementById('empty-state'),
    
    // Post Ad View
    postLoginRequired: document.getElementById('post-login-required'),
    btnLoginPost: document.getElementById('btn-login-post'),
    adPostForm: document.getElementById('ad-post-form'),
    imageDropzone: document.getElementById('image-dropzone'),
    imageInput: document.getElementById('image-input'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    btnSubmitAd: document.getElementById('btn-submit-ad'),
    
    // Dashboard View
    dashboardLoginRequired: document.getElementById('dashboard-login-required'),
    btnLoginDash: document.getElementById('btn-login-dash'),
    userAdsSection: document.getElementById('user-ads-section'),
    dashboardAvatar: document.getElementById('dashboard-avatar'),
    dashboardUserName: document.getElementById('dashboard-user-name'),
    dashboardUserEmail: document.getElementById('dashboard-user-email'),
    statMyAds: document.getElementById('stat-my-ads'),
    statTotalViews: document.getElementById('stat-total-views'),
    userAdsContainer: document.getElementById('user-ads-container'),
    userEmptyState: document.getElementById('user-empty-state'),
    
    // Ad Details Modal
    detailsModal: document.getElementById('details-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    modalMainImage: document.getElementById('modal-main-image'),
    btnPrevImg: document.getElementById('btn-prev-img'),
    btnNextImg: document.getElementById('btn-next-img'),
    modalThumbnails: document.getElementById('modal-thumbnails'),
    modalYear: document.getElementById('modal-year'),
    modalLocation: document.getElementById('modal-location'),
    modalViews: document.getElementById('modal-views'),
    modalTitle: document.getElementById('modal-title'),
    modalPrice: document.getElementById('modal-price'),
    modalNegotiableBadge: document.getElementById('modal-negotiable-badge'),
    modalMake: document.getElementById('modal-make'),
    modalModel: document.getElementById('modal-model'),
    modalYearSpec: document.getElementById('modal-year-spec'),
    modalLocationSpec: document.getElementById('modal-location-spec'),
    modalDescription: document.getElementById('modal-description'),
    modalSellerName: document.getElementById('modal-seller-name'),
    modalSellerEmail: document.getElementById('modal-seller-email'),
    modalSellerPhone: document.getElementById('modal-seller-phone'),
    btnCallSeller: document.getElementById('btn-call-seller'),
    btnWhatsappSeller: document.getElementById('btn-whatsapp-seller')
};

// Default Car Image Placeholder SVG string (clean light mode design)
const DEFAULT_CAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none"><rect width="800" height="600" fill="%23f8fafc"/><path d="M600 350H200C160 350 140 330 140 290V250C140 210 160 190 200 190H600C640 190 660 210 660 250V290C660 330 640 350 600 350Z" fill="%23e2e8f0"/><path d="M220 190L260 110C270 90 290 80 320 80H480C510 80 530 90 540 110L580 190H220Z" fill="%23ff3b30" fill-opacity="0.05" stroke="%23ff3b30" stroke-width="4"/><circle cx="260" cy="350" r="50" fill="%23ffffff" stroke="%23ff3b30" stroke-width="4"/><circle cx="540" cy="350" r="50" fill="%23ffffff" stroke="%23ff3b30" stroke-width="4"/><circle cx="260" cy="350" r="20" fill="%23cbd5e1"/><circle cx="540" cy="350" r="20" fill="%23cbd5e1"/><text x="400" y="270" font-family="sans-serif" font-size="28" font-weight="bold" fill="%230f172a" text-anchor="middle">වාහන පිස්සා.com</text></svg>`;

/* ==========================================================================
   INITIALIZATION & ROUTING
   ========================================================================== */
// Initialize theme from local storage
function initTheme() {
    const savedTheme = localStorage.getItem('vahanapissa_theme') || 'light';
    const isDark = savedTheme === 'dark';
    document.body.classList.toggle('dark-theme', isDark);
    
    // Update theme toggle button icon
    const themeIcon = document.querySelector('#btn-theme-toggle i');
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Initialize theme
    initTheme();

    // 1. Initialize Firebase or fallback
    showLoader(true);
    const fbStatus = await initializeFirebase();
    showLoader(false);
    
    // 3. Listen for auth updates
    listenToAuthChanges((user) => {
        currentUser = user;
        updateAuthUI(user);
    });
    
    // 4. Register event handlers
    setupEventHandlers();
    
    // 5. Initial fetch of ads
    loadAdsGrid();
    
    // 6. Init Lucide icons
    lucide.createIcons();
    
    // 7. Route based on URL Hash
    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
});

// Switch active tabs based on Hash URL
function handleHashRouting() {
    const hash = window.location.hash || '#home';
    const tabName = hash.replace('#', '');
    
    // Update nav links active class if it exists
    const targetLink = document.querySelector(`.nav-link[data-tab="${tabName}"]`);
    elements.tabs.forEach(link => link.classList.remove('active'));
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Update tab view visibility
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
    });
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
        
        // Scroll to top of tab smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Tab specific loading
        if (tabName === 'home') {
            loadAdsGrid();
        } else if (tabName === 'dashboard') {
            loadDashboard();
        } else if (tabName === 'admin') {
            loadAdminPanel();
        } else if (tabName === 'post') {
            loadAdPostForm();
        } else if (tabName === 'auth') {
            loadAuthView();
        }
    }
}


/* ==========================================================================
   EVENT HANDLERS BINDING
   ========================================================================== */
function setupEventHandlers() {
    // Navigate on logo click
    elements.navLogo.addEventListener('click', () => {
        window.location.hash = '#home';
    });
    
    // Hero Get Started button scroll to listings
    const heroStartBtn = document.getElementById('btn-hero-start');
    if (heroStartBtn) {
        heroStartBtn.addEventListener('click', () => {
            const listingsHeader = document.querySelector('.fleet-header');
            if (listingsHeader) {
                listingsHeader.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Tab switching click binding
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.getAttribute('data-tab');
            window.location.hash = `#${tabName}`;
        });
    });
    
    // Auth login/logout
    elements.btnLoginHeader.addEventListener('click', handleLoginTrigger);
    elements.btnLogout.addEventListener('click', handleLogoutTrigger);
    elements.btnLoginPost.addEventListener('click', handleLoginTrigger);
    elements.btnLoginDash.addEventListener('click', handleLoginTrigger);
    
    // Mock Login Popup triggers
    elements.btnCloseMockLogin.addEventListener('click', () => hideModal(elements.mockLoginModal));
    elements.mockUserSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            elements.customMockFields.classList.remove('hidden');
        } else {
            elements.customMockFields.classList.add('hidden');
        }
    });
    elements.btnSubmitMockLogin.addEventListener('click', handleMockLoginSubmit);
    // Theme toggle action
    if (elements.btnThemeToggle) {
        elements.btnThemeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('vahanapissa_theme', isDark ? 'dark' : 'light');
            const themeIcon = elements.btnThemeToggle.querySelector('i');
            if (themeIcon) {
                themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
                lucide.createIcons();
            }
        });
    }
    
    // Manual Auth Form Listeners
    const btnToggleSignIn = document.getElementById('btn-toggle-signin');
    const btnToggleRegister = document.getElementById('btn-toggle-register');
    const signInForm = document.getElementById('auth-signin-form');
    const registerForm = document.getElementById('auth-register-form');
    
    if (btnToggleSignIn && btnToggleRegister && signInForm && registerForm) {
        btnToggleSignIn.addEventListener('click', () => {
            btnToggleSignIn.classList.add('active');
            btnToggleRegister.classList.remove('active');
            signInForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        });
        
        btnToggleRegister.addEventListener('click', () => {
            btnToggleRegister.classList.add('active');
            btnToggleSignIn.classList.remove('active');
            registerForm.classList.remove('hidden');
            signInForm.classList.add('hidden');
        });
    }

    const signInFormEl = document.getElementById('auth-signin-form');
    if (signInFormEl) {
        signInFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-signin-email').value.trim();
            const password = document.getElementById('auth-signin-password').value;
            
            showLoader(true);
            try {
                let user;
                if (isFirebaseLive) {
                    user = await loginFirebaseUser(email, password);
                    showToast('Signed in successfully!', 'success');
                } else {
                    user = await loginMockUserEmail(email, password);
                    showToast(`Signed in as ${user.displayName} (Demo Mode)`, 'success');
                }
                // Redirect to home
                window.location.hash = '#home';
                signInFormEl.reset();
            } catch (error) {
                showToast('Sign-in failed: ' + error.message, 'error');
            } finally {
                showLoader(false);
            }
        });
    }

    const registerFormEl = document.getElementById('auth-register-form');
    if (registerFormEl) {
        registerFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('auth-reg-name').value.trim();
            const email = document.getElementById('auth-reg-email').value.trim();
            const password = document.getElementById('auth-reg-password').value;
            
            if (password.length < 6) {
                showToast('Password must be at least 6 characters.', 'error');
                return;
            }
            
            showLoader(true);
            try {
                let user;
                if (isFirebaseLive) {
                    user = await registerFirebaseUser(name, email, password);
                    showToast('Account registered successfully!', 'success');
                } else {
                    user = await registerMockUser(name, email, password);
                    showToast(`Mock account registered! Logged in as ${user.displayName}`, 'success');
                }
                // Redirect to home
                window.location.hash = '#home';
                registerFormEl.reset();
            } catch (error) {
                showToast('Registration failed: ' + error.message, 'error');
            } finally {
                showLoader(false);
            }
        });
    }

    const btnGoogleSignIn = document.getElementById('btn-google-signin');
    if (btnGoogleSignIn) {
        btnGoogleSignIn.addEventListener('click', async () => {
            if (!isFirebaseLive) {
                showToast('Google Sign-in is only available when Firebase is connected. Please use the Email/Password fields.', 'warning');
                return;
            }
            showLoader(true);
            try {
                await loginWithGoogle();
                showToast('Signed in with Google successfully!', 'success');
                window.location.hash = '#home';
            } catch (error) {
                showToast('Google Sign-in failed: ' + error.message, 'error');
            } finally {
                showLoader(false);
            }
        });
    }

    // Password show/hide toggle — Sign In form
    const toggleSigninBtn = document.getElementById('toggle-signin-password');
    if (toggleSigninBtn) {
        toggleSigninBtn.addEventListener('click', () => {
            const input = document.getElementById('auth-signin-password');
            const icon  = document.getElementById('toggle-signin-icon');
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
            toggleSigninBtn.classList.toggle('active', isHidden);
            lucide.createIcons();
        });
    }

    // Password show/hide toggle — Register form
    const toggleRegBtn = document.getElementById('toggle-reg-password');
    if (toggleRegBtn) {
        toggleRegBtn.addEventListener('click', () => {
            const input = document.getElementById('auth-reg-password');
            const icon  = document.getElementById('toggle-reg-icon');
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
            toggleRegBtn.classList.toggle('active', isHidden);
            lucide.createIcons();
        });
    }


    // Search / Filter inputs
    elements.searchInput.addEventListener('input', debounce(loadAdsGrid, 300));
    elements.filterMake.addEventListener('change', () => {
        const selectedMake = elements.filterMake.value;
        const logoItems = document.querySelectorAll('.logo-item');
        logoItems.forEach(item => {
            if (item.getAttribute('data-make') === selectedMake) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        loadAdsGrid();
    });
    
    // Quick brand logo filtering trigger
    const logoItems = document.querySelectorAll('.logo-item');
    logoItems.forEach(item => {
        item.addEventListener('click', () => {
            const make = item.getAttribute('data-make');
            const makeSelect = elements.filterMake;
            
            if (item.classList.contains('active')) {
                item.classList.remove('active');
                makeSelect.value = '';
            } else {
                logoItems.forEach(l => l.classList.remove('active'));
                item.classList.add('active');
                
                // Add dynamically to select dropdown if not already there
                let exists = Array.from(makeSelect.options).some(opt => opt.value === make);
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = make;
                    opt.innerText = make;
                    makeSelect.appendChild(opt);
                }
                makeSelect.value = make;
            }
            loadAdsGrid();
        });
    });

    // Footer brand shortcuts
    const brandShortcuts = document.querySelectorAll('.brand-shortcut');
    brandShortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', (e) => {
            const make = shortcut.getAttribute('data-make');
            const makeSelect = elements.filterMake;
            
            if (makeSelect) {
                let exists = Array.from(makeSelect.options).some(opt => opt.value === make);
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = make;
                    opt.innerText = make;
                    makeSelect.appendChild(opt);
                }
                makeSelect.value = make;
            }
            
            const logoItems = document.querySelectorAll('.logo-item');
            logoItems.forEach(item => {
                if (item.getAttribute('data-make') === make) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            loadAdsGrid();
        });
    });
    
    elements.filterLocation.addEventListener('change', loadAdsGrid);
    
    // Bind Airbnb Filter Modal triggers
    const btnOpenFilters = document.getElementById('btn-open-filters');
    const btnCloseFilters = document.getElementById('btn-close-filters');
    const filterModal = document.getElementById('filter-modal');
    
    if (btnOpenFilters) {
        btnOpenFilters.addEventListener('click', () => {
            openFiltersModal();
        });
    }
    if (btnCloseFilters) {
        btnCloseFilters.addEventListener('click', () => {
            hideModal(filterModal);
        });
    }
    if (filterModal) {
        filterModal.addEventListener('click', (e) => {
            if (e.target === filterModal) hideModal(filterModal);
        });
    }
    
    // Ad Posting image input uploader
    elements.imageDropzone.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', handleImageSelection);
    setupDragAndDrop();
    
    // Post Ad Form Submission
    elements.adPostForm.addEventListener('submit', handleAdSubmission);
    
    // Modal Details controls
    elements.btnCloseModal.addEventListener('click', () => hideModal(elements.detailsModal));
    elements.btnPrevImg.addEventListener('click', () => navigateDetailImage(-1));
    elements.btnNextImg.addEventListener('click', () => navigateDetailImage(1));
    
    // Modal admin action buttons
    const btnApproveModal = document.getElementById('btn-approve-modal');
    const btnRejectModal = document.getElementById('btn-reject-modal');
    if (btnApproveModal) {
        btnApproveModal.addEventListener('click', async () => {
            if (currentAdDetail) {
                await handleApproveAd(currentAdDetail.id, currentAdDetail.title);
            }
        });
    }
    if (btnRejectModal) {
        btnRejectModal.addEventListener('click', async () => {
            if (currentAdDetail) {
                await handleRejectAd(currentAdDetail.id, currentAdDetail.title);
            }
        });
    }
    
    [elements.detailsModal, elements.mockLoginModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal);
        });
    });
}

/* ==========================================================================
   AUTHENTICATION UI AND ACTIONS
   ========================================================================== */
async function handleLoginTrigger() {
    window.location.hash = '#auth';
}

function handleMockLoginSubmit() {
    const selected = elements.mockUserSelect.value;
    let name = '';
    let email = '';
    let avatar = '';
    
    if (selected === 'kasun') {
        name = 'Kasun Perera';
        email = 'kasun.perera@gmail.com';
        avatar = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=kasun';
    } else if (selected === 'shashini') {
        name = 'Shashini Silva';
        email = 'shashini.silva@gmail.com';
        avatar = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=shashini';
    } else if (selected === 'admin') {
        name = 'System Admin';
        email = 'admin@wahanapissa.com';
        avatar = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=admin';
    } else {
        name = elements.mockUserName.value.trim();
        email = elements.mockUserEmail.value.trim();
        if (!name || !email) {
            showToast('Please enter name and email for custom profile', 'error');
            return;
        }
        avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    }
    
    loginMockUser(name, email, avatar);
    hideModal(elements.mockLoginModal);
    showToast(`Signed in as ${name} (Demo Mode)`, 'success');
    
    // Reload whatever tab we are currently on to refresh authenticated views
    handleHashRouting();
}

async function handleLogoutTrigger() {
    try {
        await logoutUser();
        showToast('Logged out successfully', 'success');
        
        // Reset navigation or content view if on protected tab
        const hash = window.location.hash;
        if (hash === '#post' || hash === '#dashboard') {
            window.location.hash = '#home';
        }
    } catch (e) {
        showToast('Sign-out failed: ' + e.message, 'error');
    }
}

function updateAuthUI(user) {
    const navAdminPanel = document.getElementById('nav-admin-panel');
    if (user) {
        // Toggle header menu
        elements.btnLoginHeader.classList.add('hidden');
        elements.userProfileMenu.classList.remove('hidden');
        
        // Populate profile info
        elements.userAvatar.src = user.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=User';
        elements.userNameDisplay.innerText = user.displayName || 'User';
        
        // Check if posting form should show
        elements.postLoginRequired.classList.add('hidden');
        elements.adPostForm.classList.remove('hidden');
        
        // Pre-fill form fields
        document.getElementById('ad-seller-name').value = user.displayName || '';
        document.getElementById('ad-seller-email').value = user.email || '';

        // Show/hide admin panel link
        if (navAdminPanel) {
            if (isAdminUser(user)) {
                navAdminPanel.classList.remove('hidden');
            } else {
                navAdminPanel.classList.add('hidden');
            }
        }
    } else {
        // Logged out states
        elements.btnLoginHeader.classList.remove('hidden');
        elements.userProfileMenu.classList.add('hidden');
        
        elements.postLoginRequired.classList.remove('hidden');
        elements.adPostForm.classList.add('hidden');

        if (navAdminPanel) {
            navAdminPanel.classList.add('hidden');
        }
    }
}


/* ==========================================================================
   ADS GRID POPULATION & SEARCHING
   ========================================================================== */
async function loadAdsGrid() {
    showLoader(true);
    
    const minPriceInput = document.getElementById('price-min-input');
    const maxPriceInput = document.getElementById('price-max-input');
    
    const filters = {
        search: elements.searchInput.value,
        make: elements.filterMake.value,
        location: elements.filterLocation.value,
        minPrice: minPriceInput ? minPriceInput.value : '',
        maxPrice: maxPriceInput ? maxPriceInput.value : '',
        transmission: activeTransmission,
        fuelType: activeFuelType,
        condition: activeCondition,
        negotiableOnly: activeNegotiable === 'negotiable'
    };
    
    try {
        currentAds = await fetchAds(filters);
        renderAds(currentAds);
        populateMakeFilters(currentAds);
    } catch (e) {
        showToast('Error loading ads: ' + e.message, 'error');
    } finally {
        showLoader(false);
    }
}

function renderAds(ads) {
    elements.adsContainer.innerHTML = '';
    elements.resultsCount.innerText = `Showing ${ads.length} listing${ads.length === 1 ? '' : 's'}`;
    
    if (ads.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }
    elements.emptyState.classList.add('hidden');
    
    ads.forEach(ad => {
        const coverImg = (ad.images && ad.images.length > 0) ? ad.images[0] : DEFAULT_CAR_SVG;
        const priceFormatted = formatPrice(ad.price);
        
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.innerHTML = `
            <div class="card-image-box">
                <img src="${coverImg}" alt="${ad.title}" class="card-image" loading="lazy">
                <div class="card-badges">
                    <span class="badge badge-year">${ad.year}</span>
                    <span class="badge badge-location"><i data-lucide="map-pin"></i> ${ad.location}</span>
                </div>
                <div class="card-views-badge">
                    <i data-lucide="eye"></i> <span>${ad.views || 0}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="card-meta-top">
                    <span class="badge-negotiable ${ad.negotiable ? '' : 'hidden'}">Negotiable</span>
                </div>
                <h3 class="card-title">${escapeHTML(ad.title)}</h3>
                <div class="card-footer">
                    <div class="card-price-area">
                        <span class="card-price">LKR ${priceFormatted}</span>
                        <span class="card-price-label">Price</span>
                    </div>
                    <button class="btn btn-rent">View</button>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => openAdDetails(ad));
        elements.adsContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

// Generate the make filters dynamically from existing listings
function populateMakeFilters(ads) {
    // Only populate if list is empty or hasn't been built yet
    if (elements.filterMake.options.length > 1) return;
    
    // Extract unique makes
    const makes = new Set();
    ads.forEach(ad => {
        if (ad.make) {
            makes.add(ad.make.trim());
        }
    });
    
    // Sort and append
    Array.from(makes).sort().forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.innerText = make;
        elements.filterMake.appendChild(option);
    });
}

/* ==========================================================================
   AD DETAILS MODAL VIEWER
   ========================================================================== */
async function openAdDetails(ad) {
    currentAdDetail = ad;
    currentDetailImageIndex = 0;
    
    // Populate Modal Elements
    elements.modalTitle.innerText = ad.title;
    elements.modalYear.innerText = ad.year;
    elements.modalLocation.innerText = ad.location;
    elements.modalViews.innerText = ad.views || 0;
    elements.modalPrice.innerText = `LKR ${formatPrice(ad.price)}`;
    
    // Show/hide negotiable badge
    if (ad.negotiable) {
        elements.modalNegotiableBadge.classList.remove('hidden');
    } else {
        elements.modalNegotiableBadge.classList.add('hidden');
    }
    
    // Specs Table
    elements.modalMake.innerText = ad.make;
    elements.modalModel.innerText = ad.model;
    elements.modalYearSpec.innerText = ad.year;
    elements.modalLocationSpec.innerText = ad.location;
    
    // Description & Seller details
    elements.modalDescription.innerText = ad.description;
    elements.modalSellerName.innerText = ad.sellerName;
    elements.modalSellerEmail.innerText = ad.sellerEmail;
    elements.modalSellerPhone.innerText = ad.sellerPhone;
    
    // Set Call Phone Link
    elements.btnCallSeller.href = `tel:${ad.sellerPhone}`;
    
    // Configure WhatsApp Link
    if (ad.whatsappLinkEnabled !== false) {
        elements.btnWhatsappSeller.classList.remove('hidden');
        elements.btnWhatsappSeller.href = formatWhatsAppLink(ad.sellerPhone, ad.title);
    } else {
        elements.btnWhatsappSeller.classList.add('hidden');
    }
    
    // Setup Gallery
    setupModalGallery(ad.images);
    
    // Admin Actions in Modal
    const modalAdminActions = document.getElementById('modal-admin-actions');
    if (modalAdminActions) {
        if (isAdminUser(currentUser) && ad.status === 'under_review') {
            modalAdminActions.classList.remove('hidden');
        } else {
            modalAdminActions.classList.add('hidden');
        }
    }
    
    // Show Modal overlay
    showModal(elements.detailsModal);
    
    // Increment viewer count in DB background
    try {
        const updatedViews = await incrementAdViews(ad.id);
        if (updatedViews) {
            // Update view element locally on the active card and detail
            elements.modalViews.innerText = updatedViews;
            ad.views = updatedViews;
            
            // Find and update home listing grid card
            loadAdsGrid();
        }
    } catch (e) {
        console.error('Failed to increment view counter:', e);
    }
}

function setupModalGallery(images) {
    elements.modalThumbnails.innerHTML = '';
    const imgList = (images && images.length > 0) ? images : [DEFAULT_CAR_SVG];
    
    // Set initial image
    elements.modalMainImage.src = imgList[0];
    
    if (imgList.length <= 1) {
        elements.btnPrevImg.classList.add('hidden');
        elements.btnNextImg.classList.add('hidden');
    } else {
        elements.btnPrevImg.classList.remove('hidden');
        elements.btnNextImg.classList.remove('hidden');
        
        // Create Thumbnails
        imgList.forEach((src, idx) => {
            const thumb = document.createElement('img');
            thumb.className = `thumb-item ${idx === 0 ? 'active' : ''}`;
            thumb.src = src;
            thumb.alt = `Thumb ${idx + 1}`;
            
            thumb.addEventListener('click', () => {
                setDetailImage(idx);
            });
            
            elements.modalThumbnails.appendChild(thumb);
        });
    }
}

function setDetailImage(index) {
    const images = currentAdDetail.images || [DEFAULT_CAR_SVG];
    if (index < 0 || index >= images.length) return;
    
    currentDetailImageIndex = index;
    elements.modalMainImage.src = images[index];
    
    // Highlight thumb
    const thumbs = elements.modalThumbnails.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
        if (i === index) t.classList.add('active');
        else t.classList.remove('active');
    });
}

function navigateDetailImage(direction) {
    if (!currentAdDetail) return;
    const images = currentAdDetail.images || [DEFAULT_CAR_SVG];
    let nextIdx = currentDetailImageIndex + direction;
    
    if (nextIdx >= images.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = images.length - 1;
    
    setDetailImage(nextIdx);
}

/* ==========================================================================
   POST AD FORM CONTROLLER & IMAGE RESIZER
   ========================================================================== */
function loadAdPostForm() {
    uploadedImages = [];
    renderImagePreviews();
}

function loadAuthView() {
    if (currentUser) {
        window.location.hash = '#dashboard';
        return;
    }
    
    const btnToggleSignIn = document.getElementById('btn-toggle-signin');
    const btnToggleRegister = document.getElementById('btn-toggle-register');
    const signInForm = document.getElementById('auth-signin-form');
    const registerForm = document.getElementById('auth-register-form');
    
    if (btnToggleSignIn && btnToggleRegister && signInForm && registerForm) {
        btnToggleSignIn.classList.add('active');
        btnToggleRegister.classList.remove('active');
        signInForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }
}

function setupDragAndDrop() {
    const dropzone = elements.imageDropzone;
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        }, false);
    });
    
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleImageFiles(files);
    });
}

function handleImageSelection(e) {
    const files = e.target.files;
    handleImageFiles(files);
}

async function handleImageFiles(files) {
    const availableSlots = 5 - uploadedImages.length;
    if (availableSlots <= 0) {
        showToast('You can upload up to 5 images only.', 'error');
        return;
    }
    
    const filesArray = Array.from(files).slice(0, availableSlots);
    
    for (let file of filesArray) {
        if (!file.type.startsWith('image/')) {
            showToast(`${file.name} is not an image file.`, 'error');
            continue;
        }
        
        try {
            showLoader(true);
            const compressed = await compressImageFile(file);
            uploadedImages.push(compressed);
        } catch (err) {
            showToast(`Could not compress ${file.name}: ${err.message}`, 'error');
        } finally {
            showLoader(false);
        }
    }
    
    renderImagePreviews();
    // Reset file input value so uploader works on repeat selections
    elements.imageInput.value = '';
}

// Client Side Canvas Image Compressor
function compressImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                // Restrict boundary proportions
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export compressed JPEG format (quality scale 0.75)
                const base64Str = canvas.toDataURL('image/jpeg', 0.75);
                resolve(base64Str);
            };
        };
        reader.onerror = error => reject(error);
    });
}

function renderImagePreviews() {
    elements.imagePreviewContainer.innerHTML = '';
    
    uploadedImages.forEach((src, idx) => {
        const preview = document.createElement('div');
        preview.className = 'preview-item';
        preview.innerHTML = `
            <img src="${src}" alt="Preview" class="preview-img">
            <button type="button" class="btn-remove-preview" title="Remove image">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
            </button>
        `;
        
        preview.querySelector('.btn-remove-preview').addEventListener('click', () => {
            uploadedImages.splice(idx, 1);
            renderImagePreviews();
        });
        
        elements.imagePreviewContainer.appendChild(preview);
    });
    lucide.createIcons();
}

async function handleAdSubmission(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Please sign in to publish an advertisement.', 'error');
        return;
    }
    
    if (uploadedImages.length === 0) {
        showToast('Please upload at least one image of the vehicle.', 'error');
        return;
    }
    
    const adData = {
        title: document.getElementById('ad-title').value.trim(),
        make: document.getElementById('ad-make').value.trim(),
        model: document.getElementById('ad-model').value.trim(),
        year: parseInt(document.getElementById('ad-year').value),
        price: parseFloat(document.getElementById('ad-price').value),
        negotiable: document.getElementById('ad-negotiable').checked,
        location: document.getElementById('ad-location').value,
        description: document.getElementById('ad-description').value.trim(),
        sellerName: document.getElementById('ad-seller-name').value.trim(),
        sellerEmail: document.getElementById('ad-seller-email').value.trim(),
        sellerPhone: document.getElementById('ad-seller-phone').value.trim(),
        whatsappLinkEnabled: document.getElementById('ad-whatsapp-link').checked,
        userId: currentUser.uid,
        images: uploadedImages
    };
    
    // Basic Form validation
    if (!adData.title || !adData.make || !adData.model || !adData.year || isNaN(adData.price) || !adData.location || !adData.sellerPhone) {
        showToast('Please fill out all mandatory fields.', 'error');
        return;
    }
    
    showLoader(true);
    elements.btnSubmitAd.disabled = true;
    
    try {
        await addAd(adData);
        showToast('Advertisement submitted! It is now pending admin review.', 'success');
        elements.adPostForm.reset();
        uploadedImages = [];
        
        // Go back to home page grid
        window.location.hash = '#home';
    } catch (err) {
        showToast('Error saving advertisement: ' + err.message, 'error');
    } finally {
        showLoader(false);
        elements.btnSubmitAd.disabled = false;
    }
}

/* ==========================================================================
   USER DASHBOARD & VIEW ANALYTICS
   ========================================================================== */
async function loadDashboard() {

    if (!currentUser) {
        // Toggle dashboard display states
        elements.dashboardLoginRequired.classList.remove('hidden');
        elements.userAdsSection.classList.add('hidden');
        return;
    }
    
    elements.dashboardLoginRequired.classList.add('hidden');
    elements.userAdsSection.classList.remove('hidden');
    
    // Set profile graphics
    elements.dashboardAvatar.src = currentUser.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=User';
    elements.dashboardUserName.innerText = currentUser.displayName || 'Guest User';
    elements.dashboardUserEmail.innerText = currentUser.email || '';
    
    showLoader(true);
    
    try {
        const userAds = await fetchAds({ userId: currentUser.uid, status: 'all' });
        renderDashboardAds(userAds);
        
        // Calculate View count aggregations
        let totalViews = 0;
        userAds.forEach(ad => {
            totalViews += (ad.views || 0);
        });
        
        elements.statMyAds.innerText = userAds.length;
        elements.statTotalViews.innerText = totalViews;
        
    } catch (e) {
        showToast('Error loading dashboard statistics: ' + e.message, 'error');
    } finally {
        showLoader(false);
    }
}

function renderDashboardAds(ads) {
    elements.userAdsContainer.innerHTML = '';
    
    if (ads.length === 0) {
        elements.userEmptyState.classList.remove('hidden');
        return;
    }
    elements.userEmptyState.classList.add('hidden');
    
    ads.forEach(ad => {
        const coverImg = (ad.images && ad.images.length > 0) ? ad.images[0] : DEFAULT_CAR_SVG;
        const priceFormatted = formatPrice(ad.price);
        
        const statusVal = ad.status || 'approved';
        let statusBadgeHTML = '';
        if (statusVal === 'under_review') {
            statusBadgeHTML = `<span class="badge" style="background-color: #f59e0b; color: white;">Pending Review</span>`;
        } else if (statusVal === 'approved') {
            statusBadgeHTML = `<span class="badge" style="background-color: #10b981; color: white;">Approved</span>`;
        } else if (statusVal === 'rejected') {
            statusBadgeHTML = `<span class="badge" style="background-color: #ef4444; color: white;">Rejected</span>`;
        }
        
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.innerHTML = `
            <div class="card-image-box">
                <img src="${coverImg}" alt="${ad.title}" class="card-image" loading="lazy">
                <div class="card-badges">
                    <span class="badge dashboard-card-badge">${ad.year}</span>
                    <span class="badge badge-location"><i data-lucide="map-pin"></i> ${ad.location}</span>
                    ${statusBadgeHTML}
                </div>
                <div class="card-views-badge">
                    <i data-lucide="eye"></i> <span>${ad.views || 0}</span> views
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title">${escapeHTML(ad.title)}</h3>
                <div class="card-footer">
                    <span class="card-price">LKR ${priceFormatted}</span>
                </div>
                <div class="card-actions-row">
                    <button class="btn btn-secondary btn-sm btn-view-dash" style="flex:1;">
                        <i data-lucide="maximize-2" style="width: 14px; height: 14px;"></i> View
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-dash" title="Delete Listing">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        // Detail View trigger
        card.querySelector('.btn-view-dash').addEventListener('click', (e) => {
            e.stopPropagation();
            openAdDetails(ad);
        });
        
        // Deletion Trigger
        card.querySelector('.btn-delete-dash').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${ad.title}"? This cannot be undone.`)) {
                showLoader(true);
                try {
                    await deleteAd(ad.id, currentUser.uid);
                    showToast('Ad deleted successfully!', 'success');
                    loadDashboard(); // Refresh
                } catch (err) {
                    showToast('Deletion failed: ' + err.message, 'error');
                } finally {
                    showLoader(false);
                }
            }
        });
        
        elements.userAdsContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

/* ==========================================================================
   UI UTILITY & HELPER FUNCTIONS
   ========================================================================== */
function showModal(modalElement) {
    modalElement.classList.remove('hidden');
}

function hideModal(modalElement) {
    modalElement.classList.add('hidden');
}

// Full page loader toggle overlay
function showLoader(show) {
    if (show) {
        elements.adsLoader.classList.remove('hidden');
    } else {
        elements.adsLoader.classList.add('hidden');
    }
}

// Notification Toast Alert
let toastTimer = null;
function showToast(message, type = 'success') {
    elements.toastMessage.innerText = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.remove('hidden');
    
    if (toastTimer) clearTimeout(toastTimer);
    
    toastTimer = setTimeout(() => {
        elements.toast.classList.add('hidden');
    }, 4000);
}

// Price Formatting: inserts commas e.g. 7500000 -> 7,500,000.00
function formatPrice(number) {
    return new Intl.NumberFormat('en-LK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// WhatsApp link generator: replaces starting 0 with 94
function formatWhatsAppLink(phone, title) {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '94' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7') && cleanPhone.length === 9) {
        cleanPhone = '94' + cleanPhone;
    }
    
    const msg = `Hi, I am interested in your car: "${title}" posted on වාහන පිස්සා.com. Is it still available?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// Debounce helper to prevent heavy queries during typing
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Prevent HTML injections in strings
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/* ==========================================================================
   AIRBNB-STYLE FILTERS DIALOG CONTROLLER
   ========================================================================== */

async function openFiltersModal() {
    showModal(document.getElementById('filter-modal'));
    initFiltersModal();
    
    // Calculate dynamic base stats
    try {
        const allAds = await fetchAds({}); // Fetch all listings without filters to build base stats
        const average = allAds.length > 0 ? (allAds.reduce((acc, curr) => acc + curr.price, 0) / allAds.length) : 24000000;
        
        const avgEl = document.getElementById('filter-price-avg');
        if (avgEl) {
            avgEl.innerText = `The average price of vehicles is LKR ${formatPrice(average)}`;
        }
        
        // Render price distribution histogram
        renderPriceHistogram(allAds);
    } catch (e) {
        console.error('Error opening filters modal:', e);
    }
    
    // Update matching vehicle count
    updateApplyBtnCount();
}

function initFiltersModal() {
    if (filterModalInitialized) return;
    filterModalInitialized = true;
    
    const minRange = document.getElementById('price-min-range');
    const maxRange = document.getElementById('price-max-range');
    const minInput = document.getElementById('price-min-input');
    const maxInput = document.getElementById('price-max-input');
    
    if (!minRange || !maxRange || !minInput || !maxInput) return;
    
    // 1. Sync dual range sliders with each other and numeric inputs
    minRange.addEventListener('input', () => {
        let minVal = parseInt(minRange.value);
        let maxVal = parseInt(maxRange.value);
        
        if (minVal > maxVal - 100000) {
            minVal = maxVal - 100000;
            minRange.value = minVal;
        }
        minInput.value = minVal;
        
        updateSliderTrack();
        updateHistogramHighlight(minVal, maxVal);
        updateApplyBtnCount();
    });
    
    maxRange.addEventListener('input', () => {
        let minVal = parseInt(minRange.value);
        let maxVal = parseInt(maxRange.value);
        
        if (maxVal < minVal + 100000) {
            maxVal = minVal + 100000;
            maxRange.value = maxVal;
        }
        maxInput.value = maxVal;
        
        updateSliderTrack();
        updateHistogramHighlight(minVal, maxVal);
        updateApplyBtnCount();
    });
    
    // 2. Sync numeric input text boxes with range sliders
    minInput.addEventListener('input', () => {
        let minVal = parseInt(minInput.value) || 0;
        let maxVal = parseInt(maxRange.value);
        
        if (minVal > maxVal - 100000) {
            minVal = maxVal - 100000;
        }
        minRange.value = minVal;
        
        updateSliderTrack();
        updateHistogramHighlight(minVal, maxVal);
        updateApplyBtnCount();
    });
    
    maxInput.addEventListener('input', () => {
        let minVal = parseInt(minRange.value);
        let maxVal = parseInt(maxInput.value) || 60000000;
        
        if (maxVal < minVal + 100000) {
            maxVal = minVal + 100000;
        }
        maxRange.value = maxVal;
        
        updateSliderTrack();
        updateHistogramHighlight(minVal, maxVal);
        updateApplyBtnCount();
    });
    
    // 3. Setup Option Pills selection groups (Condition, Transmission, Fuel)
    setupPillGroup('selector-condition', (val) => { activeCondition = val; });
    setupPillGroup('selector-transmission', (val) => { activeTransmission = val; });
    setupPillGroup('selector-fuel', (val) => { activeFuelType = val; });
    
    // 4. Setup Price Negotiability Cards (Type of Place lookalike)
    const cardOptions = document.querySelectorAll('#selector-negotiable .card-option');
    cardOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            cardOptions.forEach(c => c.classList.remove('active'));
            opt.classList.add('active');
            activeNegotiable = opt.getAttribute('data-value');
            updateApplyBtnCount();
        });
    });
    
    // 5. Connect Clear links and Apply Buttons
    const btnClearAll = document.getElementById('btn-clear-all-filters');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', clearAllFilters);
    }
    
    const btnApply = document.getElementById('btn-apply-filters');
    if (btnApply) {
        btnApply.addEventListener('click', () => {
            hideModal(document.getElementById('filter-modal'));
            loadAdsGrid();
        });
    }
    
    // Draw initial slider track fill
    updateSliderTrack();
}

// Helper to bind click listeners on option pills
function setupPillGroup(groupId, stateSetter) {
    const pills = document.querySelectorAll(`#${groupId} .pill-option`);
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            stateSetter(pill.getAttribute('data-value'));
            updateApplyBtnCount();
        });
    });
}

function updateSliderTrack() {
    const minRange = document.getElementById('price-min-range');
    const maxRange = document.getElementById('price-max-range');
    const sliderTrack = document.getElementById('slider-track');
    
    if (!minRange || !maxRange || !sliderTrack) return;
    
    const min = parseFloat(minRange.value);
    const max = parseFloat(maxRange.value);
    const total = parseFloat(minRange.max);
    
    const leftPct = (min / total) * 100;
    const rightPct = 100 - (max / total) * 100;
    
    sliderTrack.style.left = `${leftPct}%`;
    sliderTrack.style.right = `${rightPct}%`;
}

function renderPriceHistogram(allAds) {
    const histogramEl = document.getElementById('price-histogram');
    if (!histogramEl) return;
    
    const numBins = 24;
    const maxVal = 60000000;
    const binWidth = maxVal / numBins;
    const bins = Array(numBins).fill(0);
    
    allAds.forEach(ad => {
        const binIdx = Math.min(Math.floor(ad.price / binWidth), numBins - 1);
        bins[binIdx]++;
    });
    
    const maxCount = Math.max(...bins, 1);
    histogramEl.innerHTML = '';
    
    const minSliderVal = parseInt(document.getElementById('price-min-range').value);
    const maxSliderVal = parseInt(document.getElementById('price-max-range').value);
    
    bins.forEach((count, i) => {
        const bar = document.createElement('div');
        bar.className = 'histo-bar';
        bar.style.height = `${(count / maxCount) * 100}%`;
        
        const binMin = i * binWidth;
        const binMax = (i + 1) * binWidth;
        
        bar.setAttribute('data-min', binMin);
        bar.setAttribute('data-max', binMax);
        
        // Highlight bars within the slider range
        if (binMin >= minSliderVal && binMax <= maxSliderVal) {
            bar.classList.add('active');
        }
        
        histogramEl.appendChild(bar);
    });
}

function updateHistogramHighlight(minVal, maxVal) {
    const bars = document.querySelectorAll('.histo-bar');
    bars.forEach(bar => {
        const binMin = parseFloat(bar.getAttribute('data-min'));
        const binMax = parseFloat(bar.getAttribute('data-max'));
        
        if (binMin >= minVal && binMax <= maxVal) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
}

async function updateApplyBtnCount() {
    const minPriceInput = document.getElementById('price-min-input');
    const maxPriceInput = document.getElementById('price-max-input');
    
    const filters = {
        search: elements.searchInput.value,
        make: elements.filterMake.value,
        location: elements.filterLocation.value,
        minPrice: minPriceInput ? minPriceInput.value : '',
        maxPrice: maxPriceInput ? maxPriceInput.value : '',
        transmission: activeTransmission,
        fuelType: activeFuelType,
        condition: activeCondition,
        negotiableOnly: activeNegotiable === 'negotiable'
    };
    
    try {
        const matches = await fetchAds(filters);
        const applyBtn = document.getElementById('btn-apply-filters');
        if (applyBtn) {
            applyBtn.innerText = `Show ${matches.length} vehicle${matches.length === 1 ? '' : 's'}`;
        }
    } catch (e) {
        console.error('Error counting vehicles:', e);
    }
}

function clearAllFilters() {
    const minRange = document.getElementById('price-min-range');
    const maxRange = document.getElementById('price-max-range');
    const minInput = document.getElementById('price-min-input');
    const maxInput = document.getElementById('price-max-input');
    
    if (minRange && maxRange && minInput && maxInput) {
        minRange.value = 0;
        maxRange.value = 60000000;
        minInput.value = 0;
        maxInput.value = 60000000;
    }
    
    updateSliderTrack();
    updateHistogramHighlight(0, 60000000);
    
    // Clear selection categories
    activeCondition = "";
    activeTransmission = "";
    activeFuelType = "";
    activeNegotiable = "";
    
    // Reset active class elements in UI
    document.querySelectorAll('.pill-selector-group').forEach(group => {
        const pills = group.querySelectorAll('.pill-option');
        pills.forEach((p, idx) => {
            if (idx === 0) p.classList.add('active');
            else p.classList.remove('active');
        });
    });
    
    const cards = document.querySelectorAll('#selector-negotiable .card-option');
    cards.forEach((c, idx) => {
        if (idx === 0) c.classList.add('active');
        else c.classList.remove('active');
    });
    
    updateApplyBtnCount();
}

/* ==========================================================================
   ADMIN CONTROL PANEL CONTROLLER & HANDLERS
   ========================================================================== */

async function loadAdminPanel() {
    if (!currentUser || !isAdminUser(currentUser)) {
        window.location.hash = '#home';
        return;
    }
    
    showLoader(true);
    try {
        // Fetch ads that are under review
        const pendingAds = await fetchAds({ status: 'under_review' });
        
        // Update stats
        const pendingCountEl = document.getElementById('stat-pending-ads');
        if (pendingCountEl) {
            pendingCountEl.innerText = pendingAds.length;
        }
        
        renderAdminAds(pendingAds);
    } catch (e) {
        showToast('Error loading pending ads: ' + e.message, 'error');
    } finally {
        showLoader(false);
    }
}

function renderAdminAds(ads) {
    const adminAdsContainer = document.getElementById('admin-ads-container');
    const adminEmptyState = document.getElementById('admin-empty-state');
    
    if (!adminAdsContainer) return;
    
    adminAdsContainer.innerHTML = '';
    
    if (ads.length === 0) {
        if (adminEmptyState) adminEmptyState.classList.remove('hidden');
        return;
    }
    if (adminEmptyState) adminEmptyState.classList.add('hidden');
    
    ads.forEach(ad => {
        const coverImg = (ad.images && ad.images.length > 0) ? ad.images[0] : DEFAULT_CAR_SVG;
        const priceFormatted = formatPrice(ad.price);
        
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.innerHTML = `
            <div class="card-image-box">
                <img src="${coverImg}" alt="${ad.title}" class="card-image" loading="lazy">
                <div class="card-badges">
                    <span class="badge dashboard-card-badge">${ad.year}</span>
                    <span class="badge badge-location"><i data-lucide="map-pin"></i> ${ad.location}</span>
                </div>
            </div>
            <div class="card-body">
                <h3 class="card-title">${escapeHTML(ad.title)}</h3>
                <div class="card-footer">
                    <span class="card-price">LKR ${priceFormatted}</span>
                </div>
                <div class="card-actions-row" style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn btn-secondary btn-sm btn-view-admin" style="flex:1;">
                        <i data-lucide="maximize-2" style="width: 14px; height: 14px;"></i> View
                    </button>
                    <button class="btn btn-success btn-sm btn-approve-admin" style="flex:1;">
                        <i data-lucide="check" style="width: 14px; height: 14px;"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-sm btn-reject-admin" style="flex:1;">
                        <i data-lucide="x" style="width: 14px; height: 14px;"></i> Reject
                    </button>
                </div>
            </div>
        `;
        
        // View detail trigger
        card.querySelector('.btn-view-admin').addEventListener('click', (e) => {
            e.stopPropagation();
            openAdDetails(ad);
        });
        
        // Approve trigger
        card.querySelector('.btn-approve-admin').addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleApproveAd(ad.id, ad.title);
        });
        
        // Reject trigger
        card.querySelector('.btn-reject-admin').addEventListener('click', async (e) => {
            e.stopPropagation();
            await handleRejectAd(ad.id, ad.title);
        });
        
        adminAdsContainer.appendChild(card);
    });
    
    lucide.createIcons();
}

async function handleApproveAd(adId, title) {
    if (confirm(`Are you sure you want to approve "${title}"?`)) {
        showLoader(true);
        try {
            await updateAdStatus(adId, 'approved');
            showToast('Advertisement approved successfully!', 'success');
            
            // If the details modal is open for this ad, close it
            if (currentAdDetail && currentAdDetail.id === adId) {
                hideModal(elements.detailsModal);
            }
            
            // Refresh
            loadAdminPanel();
        } catch (err) {
            showToast('Approval failed: ' + err.message, 'error');
        } finally {
            showLoader(false);
        }
    }
}

async function handleRejectAd(adId, title) {
    if (confirm(`Are you sure you want to reject "${title}"?`)) {
        showLoader(true);
        try {
            await updateAdStatus(adId, 'rejected');
            showToast('Advertisement rejected.', 'warning');
            
            // If the details modal is open for this ad, close it
            if (currentAdDetail && currentAdDetail.id === adId) {
                hideModal(elements.detailsModal);
            }
            
            // Refresh
            loadAdminPanel();
        } catch (err) {
            showToast('Rejection failed: ' + err.message, 'error');
        } finally {
            showLoader(false);
        }
    }
}
