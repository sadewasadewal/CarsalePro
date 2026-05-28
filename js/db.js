// js/db.js
import { isFirebaseLive, firebaseDb } from './config.js';

const MOCK_ADS_KEY = 'vahanapissa_mock_ads';

// Pre-seeded high-quality mock ads
const INITIAL_MOCK_ADS = [
    {
        id: 'mock_ad_1',
        title: 'Toyota Supra GR Coupe 2021 Mint Condition',
        make: 'Toyota',
        model: 'Supra',
        year: 2021,
        price: 38500000,
        negotiable: true,
        location: 'Colombo',
        description: 'GR Supra Premium Edition. Finished in Absolute Zero White. Black Leather Interior. 3.0L Turbocharged Inline 6. 8-Speed Automatic. Head-Up Display, JBL 12-Speaker Premium Sound System, Active Damper Suspension. Single Owner, 100% Agency Maintained. Immaculate condition, no modifications.',
        images: [
            'https://images.unsplash.com/photo-1617469767053-d3b508a0d84e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&auto=format&fit=crop&q=80'
        ],
        sellerName: 'Dilshan Silva',
        sellerEmail: 'dilshan.s@gmail.com',
        sellerPhone: '+94773123456',
        whatsappLinkEnabled: true,
        views: 245,
        userId: 'mock_uid_kasun',
        status: 'approved',
        createdAt: Date.now() - 3600000 * 2 // 2 hours ago
    },
    {
        id: 'mock_ad_2',
        title: 'BMW M4 Competition Coupe 2022',
        make: 'BMW',
        model: 'M4',
        year: 2022,
        price: 49500000,
        negotiable: false,
        location: 'Gampaha',
        description: 'BMW M4 Competition (G82) finished in Isle of Man Green metallic with Yas Marina Blue Merino leather interior. Carbon fiber interior trim. M Carbon bucket seats. M Drivers Package. 19/20-inch M double-spoke wheels. Harman Kardon surround sound system. Laser lights. Brand new tires recently fitted.',
        images: [
            'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80'
        ],
        sellerName: 'Shashini Silva',
        sellerEmail: 'shashini.silva@gmail.com',
        sellerPhone: '+94714987654',
        whatsappLinkEnabled: true,
        views: 189,
        userId: 'mock_uid_shashini',
        status: 'approved',
        createdAt: Date.now() - 3600000 * 24 // 1 day ago
    },
    {
        id: 'mock_ad_3',
        title: 'Nissan GT-R Nismo Edition 2018',
        make: 'Nissan',
        model: 'GT-R',
        year: 2018,
        price: 52000000,
        negotiable: true,
        location: 'Colombo',
        description: 'Immaculate Nissan GT-R Nismo Edition. Pearl Black Exterior. Recaro Carbon Fiber Racing seats. Titanium exhaust system. 3.8L Twin-Turbo V6 putting out 600hp. Ceramic brakes. Alcantara wrapped dashboard and steering wheel. A true collector item in Sri Lanka. Fully ceramic coated.',
        images: [
            'https://images.unsplash.com/photo-1611245084931-1559864adab8?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80'
        ],
        sellerName: 'Kasun Perera',
        sellerEmail: 'kasun.perera@gmail.com',
        sellerPhone: '+94777555888',
        whatsappLinkEnabled: true,
        views: 412,
        userId: 'mock_uid_kasun',
        status: 'approved',
        createdAt: Date.now() - 3600000 * 48 // 2 days ago
    },
    {
        id: 'mock_ad_4',
        title: 'Tesla Model S Plaid 2022 Dual Motor',
        make: 'Tesla',
        model: 'Model S',
        year: 2022,
        price: 43000000,
        negotiable: true,
        location: 'Kandy',
        description: 'Tesla Model S Plaid. Solid Black exterior with Carbon Fiber details and Black interior. Yoke steering wheel, triple-motor AWD, 1020 Horsepower. 0-100 km/h in 2.1 seconds. Full Self-Driving capability. CCS2 enabled. 21" Arachnid Wheels. Pristine condition with low mileage.',
        images: [
            'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1563720223523-491ff04651de?w=800&auto=format&fit=crop&q=80'
        ],
        sellerName: 'Janaka Perera',
        sellerEmail: 'janaka.perera@outlook.com',
        sellerPhone: '+94723456789',
        whatsappLinkEnabled: true,
        views: 98,
        userId: 'mock_uid_other',
        status: 'approved',
        createdAt: Date.now() - 3600000 * 72 // 3 days ago
    },
    {
        id: 'mock_ad_5',
        title: 'Range Rover Sport HSE Dynamic 2020',
        make: 'Land Rover',
        model: 'Range Rover Sport',
        year: 2020,
        price: 36500000,
        negotiable: false,
        location: 'Kalutara',
        description: 'Range Rover Sport HSE Dynamic. Fuji White exterior with Black Pack. Panoramic Sliding Roof. Red Brembo Brake Calipers. Meridian Surround Sound System. 21-inch 9 Spoke Gloss Black alloy wheels. Matrix LED Headlights. Premium Windsor Leather Seats. Carefully used.',
        images: [
            'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
        ],
        sellerName: 'Amara Gamage',
        sellerEmail: 'amara.gamage@yahoo.com',
        sellerPhone: '+94701234567',
        whatsappLinkEnabled: true,
        views: 145,
        userId: 'mock_uid_other2',
        status: 'approved',
        createdAt: Date.now() - 3600000 * 96 // 4 days ago
    }
];

// Helper to initialize local storage database
function getMockAds() {
    try {
        const stored = localStorage.getItem(MOCK_ADS_KEY);
        if (!stored) {
            localStorage.setItem(MOCK_ADS_KEY, JSON.stringify(INITIAL_MOCK_ADS));
            return INITIAL_MOCK_ADS;
        }
        return JSON.parse(stored);
    } catch (e) {
        console.error('Error fetching mock ads:', e);
        return INITIAL_MOCK_ADS;
    }
}

function saveMockAds(ads) {
    try {
        localStorage.setItem(MOCK_ADS_KEY, JSON.stringify(ads));
        return true;
    } catch (e) {
        console.error('Error saving mock ads:', e);
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
            throw new Error('Local storage space is full. To store more advertisements and high-resolution images, please connect to Firebase.');
        }
        throw e;
    }
}

// ----------------- EXPORTED DATABASE ACTIONS -----------------

// Fetch ads with filters
export async function fetchAds(filters = {}) {
    if (isFirebaseLive && firebaseDb) {
        try {
            const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            const adsCol = collection(firebaseDb, 'ads');
            // Fetch sorted by newest
            const q = query(adsCol, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            let ads = [];
            querySnapshot.forEach((doc) => {
                ads.push({ id: doc.id, ...doc.data() });
            });
            
            // Apply filtering client-side for complex multi-filters (avoiding Firestore index requirements)
            return filterAdsList(ads, filters);
        } catch (error) {
            console.error('Firestore fetch ads error, falling back to local mock data:', error);
            return filterAdsList(getMockAds(), filters);
        }
    } else {
        // Mock DB Flow
        const ads = getMockAds();
        // Sort by newest first
        ads.sort((a, b) => b.createdAt - a.createdAt);
        return filterAdsList(ads, filters);
    }
}

// Client side filtering helper
function filterAdsList(ads, filters) {
    let result = [...ads];
    
    // Status filter (approved by default for public, unless specified otherwise)
    const targetStatus = filters.status !== undefined ? filters.status : 'approved';
    if (targetStatus !== 'all') {
        result = result.filter(ad => (ad.status || 'approved') === targetStatus);
    }
    
    if (filters.search) {
        const term = filters.search.toLowerCase().trim();
        result = result.filter(ad => 
            ad.title.toLowerCase().includes(term) ||
            ad.make.toLowerCase().includes(term) ||
            ad.model.toLowerCase().includes(term) ||
            ad.description.toLowerCase().includes(term)
        );
    }
    
    if (filters.make) {
        const makeFilter = filters.make.toLowerCase().trim();
        result = result.filter(ad => ad.make.toLowerCase() === makeFilter);
    }
    
    if (filters.location) {
        result = result.filter(ad => ad.location === filters.location);
    }
    
    // Min/Max Price filter range
    if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== '') {
        const minVal = parseFloat(filters.minPrice);
        if (!isNaN(minVal)) {
            result = result.filter(ad => ad.price >= minVal);
        }
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== '') {
        const maxVal = parseFloat(filters.maxPrice);
        if (!isNaN(maxVal)) {
            result = result.filter(ad => ad.price <= maxVal);
        }
    }
    
    // Transmission filter
    if (filters.transmission) {
        const transVal = filters.transmission.toLowerCase().trim();
        result = result.filter(ad => ad.description.toLowerCase().includes(transVal) || 
                                     ad.title.toLowerCase().includes(transVal));
    }
    
    // Fuel Type filter
    if (filters.fuelType) {
        const fuelVal = filters.fuelType.toLowerCase().trim();
        result = result.filter(ad => ad.description.toLowerCase().includes(fuelVal) || 
                                     ad.title.toLowerCase().includes(fuelVal));
    }
    
    // Condition filter
    if (filters.condition) {
        const condVal = filters.condition.toLowerCase().trim();
        result = result.filter(ad => ad.description.toLowerCase().includes(condVal) || 
                                     ad.title.toLowerCase().includes(condVal));
    }
    
    // Negotiable state card filter
    if (filters.negotiableOnly) {
        result = result.filter(ad => ad.negotiable === true);
    }
    
    if (filters.userId) {
        result = result.filter(ad => ad.userId === filters.userId);
    }
    
    return result;
}

// Add new advertisement
export async function addAd(adData) {
    const newAd = {
        ...adData,
        status: 'under_review', // New ads are under review by default
        views: 0,
        createdAt: Date.now()
    };
    
    if (isFirebaseLive && firebaseDb) {
        try {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            const docRef = await addDoc(collection(firebaseDb, 'ads'), newAd);
            return { id: docRef.id, ...newAd };
        } catch (error) {
            console.error('Firestore add ad error:', error);
            throw new Error('Firestore Write Failed: ' + error.message);
        }
    } else {
        return saveMockAdLocal(newAd);
    }
}

function saveMockAdLocal(ad) {
    const ads = getMockAds();
    ad.id = 'mock_ad_' + Math.random().toString(36).substr(2, 9);
    ads.push(ad);
    saveMockAds(ads);
    return ad;
}

// Increment Ad Views count
export async function incrementAdViews(adId) {
    if (isFirebaseLive && firebaseDb && !adId.startsWith('mock_ad_')) {
        try {
            const { doc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            const docRef = doc(firebaseDb, 'ads', adId);
            await updateDoc(docRef, {
                views: increment(1)
            });
            return true;
        } catch (error) {
            console.error('Firestore increment views error:', error);
        }
    }
    
    // Fallback/Mock View Increment
    const ads = getMockAds();
    const adIndex = ads.findIndex(a => a.id === adId);
    if (adIndex !== -1) {
        ads[adIndex].views = (ads[adIndex].views || 0) + 1;
        saveMockAds(ads);
        return ads[adIndex].views;
    }
    return 0;
}

// Delete Advertisement
export async function deleteAd(adId, userId) {
    if (isFirebaseLive && firebaseDb && !adId.startsWith('mock_ad_')) {
        try {
            const { doc, getDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            const docRef = doc(firebaseDb, 'ads', adId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists() && docSnap.data().userId === userId) {
                await deleteDoc(docRef);
                return true;
            }
            throw new Error('Unauthorized deletion or ad not found');
        } catch (error) {
            console.error('Firestore delete ad error:', error);
            throw error;
        }
    } else {
        const ads = getMockAds();
        const adIndex = ads.findIndex(a => a.id === adId);
        if (adIndex !== -1) {
            if (ads[adIndex].userId === userId) {
                ads.splice(adIndex, 1);
                saveMockAds(ads);
                return true;
            }
        }
        throw new Error('Unauthorized deletion or ad not found');
    }
}

// Update Ad Status (for Admin approval/rejection)
export async function updateAdStatus(adId, status) {
    if (isFirebaseLive && firebaseDb && !adId.startsWith('mock_ad_')) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
            const docRef = doc(firebaseDb, 'ads', adId);
            await updateDoc(docRef, { status: status });
            return true;
        } catch (error) {
            console.error('Firestore update status error:', error);
            throw error;
        }
    } else {
        const ads = getMockAds();
        const adIndex = ads.findIndex(a => a.id === adId);
        if (adIndex !== -1) {
            ads[adIndex].status = status;
            saveMockAds(ads);
            return true;
        }
        throw new Error('Ad not found');
    }
}
