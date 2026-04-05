// Ticketmaster API Integration
const API_KEY = "MV1VQwtiyrw1RgKRaGAc36qgQRYSEAmg";
const COUNTRY = "SE";

let releases = []; // Will be populated from API
let availableCategories = new Set();
let currentFilter = 'All Drops';
let currentSort = 'releaseDate'; // Default sort
let currentListType = 'upcoming'; // 'upcoming' or 'released'

// Admin overrides State
let adminOverrides = JSON.parse(localStorage.getItem('ticketTrackerOverrides')) || {};
let rawTicketmasterEvents = [];

// User Management via LocalStorage
let currentUser = JSON.parse(localStorage.getItem('ticketTrackerUser')) || null;

// DOM Elements
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const closeModal = document.querySelector('.close-modal');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username-input');

const userProfile = document.getElementById('user-profile');
const userGreeting = document.getElementById('user-greeting');

const navAllReleases = document.getElementById('nav-all-releases');
const navDashboard = document.getElementById('nav-dashboard');
const navAdmin = document.getElementById('nav-admin');

const viewAll = document.getElementById('view-all');
const viewDashboard = document.getElementById('view-dashboard');
const viewEventDetail = document.getElementById('view-event-detail');
const viewAdmin = document.getElementById('view-admin');

const adminTableBody = document.getElementById('admin-table-body');

const loadingSpinner = document.getElementById('loading-spinner');
const allGrid = document.getElementById('events-grid');
const trackedGrid = document.getElementById('tracked-grid');
const noTracksMessage = document.getElementById('no-tracks-message');
const filterContainer = document.getElementById('filter-container');
const sortSelect = document.getElementById('sort-select');

// Detail View Elements
const backBtn = document.getElementById('back-to-list-btn');
const dTitle = document.getElementById('detail-title');
const dArtist = document.getElementById('detail-artist');
const dLocationInfo = document.getElementById('detail-location-info');
const dFullInfo = document.getElementById('detail-full-info');
const dParticipants = document.getElementById('detail-participants');
const dReleaseDate = document.getElementById('detail-release-date');
const dBuySite = document.getElementById('detail-buy-site');
const dTrackBtn = document.getElementById('detail-track-btn');

let currentViewContext = 'all'; 

// Fetch Data from Ticketmaster
async function fetchTicketmasterEvents() {
    try {
        const dynamicUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&countryCode=${COUNTRY}&size=200`;

        const response = await fetch(dynamicUrl);
        if (!response.ok) throw new Error("API Network response was not ok");
        const data = await response.json();
        
        if (data._embedded && data._embedded.events) {
            rawTicketmasterEvents = data._embedded.events;
            mapTicketmasterData(rawTicketmasterEvents);
        } else {
            console.warn("No events found in API response.");
        }
    } catch (error) {
        console.error("Error fetching events:", error);
        allGrid.innerHTML = `<p class="empty-state">Unable to load events at this time. Please check your connection or try again later.</p>`;
    } finally {
        loadingSpinner.classList.add('hidden');
        allGrid.classList.remove('hidden');
        renderFilters();
        renderGrids();
    }
}

// Transform Ticketmaster JSON to App Data Structure
function mapTicketmasterData(events) {
    const groupedMap = new Map();
    const now = new Date();

    events.forEach(event => {
        // Extract Sale/Release Date FIRST
        let releaseDateStr = "TBA";
        let rawReleaseObj = null;
        let daysUntilDrop = null;
        let releaseTimestamp = Number.MAX_SAFE_INTEGER;

        if (event.sales && event.sales.public && event.sales.public.startDateTime) {
            rawReleaseObj = new Date(event.sales.public.startDateTime);
            
            releaseTimestamp = rawReleaseObj.getTime();
            releaseDateStr = rawReleaseObj.toLocaleDateString() + " - " + rawReleaseObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Calculate days until drop for logic/badges
            const timeDiff = rawReleaseObj.getTime() - now.getTime();
            daysUntilDrop = Math.ceil(timeDiff / (1000 * 3600 * 24));
        } else {
            // If we don't know the sale date, exclude it.
            return;
        }

        // Extract Category
        let category = "Misc";
        if (event.classifications && event.classifications.length > 0) {
            if (event.classifications[0].segment) {
                category = event.classifications[0].segment.name;
            }
        }

        // Extract Location
        let location = "TBA";
        if (event._embedded && event._embedded.venues && event._embedded.venues.length > 0) {
            location = event._embedded.venues[0].name;
        }

        // Extract Participants/Attractions
        let participants = [];
        let artistName = event.name; // Fallback to event name
        if (event._embedded && event._embedded.attractions) {
            participants = event._embedded.attractions.map(attraction => attraction.name);
            artistName = participants[0] || event.name; 
        }

        // Individual Event Date
        let currentEventDateObj = null;
        if (event.dates && event.dates.start && event.dates.start.localDate) {
             currentEventDateObj = new Date(event.dates.start.localDate);
        }
        
        // --- ADMIN OVERRIDES ---
        if (adminOverrides[event.id]) {
            const over = adminOverrides[event.id];
            if (over.category) category = over.category;
            if (over.releaseDateStr && over.releaseTimestamp) {
                releaseDateStr = over.releaseDateStr;
                releaseTimestamp = over.releaseTimestamp;
                const timeDiff = releaseTimestamp - now.getTime();
                daysUntilDrop = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }
        }

        availableCategories.add(category);
        
        // Grouping Key Definition
        const groupingKey = `${artistName}_${releaseTimestamp}`;

        if (groupedMap.has(groupingKey)) {
            // Event already exists, just add the new date to we can calculate the range later
            if (currentEventDateObj) {
                groupedMap.get(groupingKey).allDateObjects.push(currentEventDateObj);
            }
        } else {
             // Completely new event release
            groupedMap.set(groupingKey, {
                id: event.id, // Primary ID
                title: event.name,
                artist: artistName,
                releaseDate: releaseDateStr,
                rawReleaseTimestamp: releaseTimestamp,
                daysUntilDrop: daysUntilDrop,
                location: location,
                description: event.info || event.description || "Exciting upcoming event from Ticketmaster.",
                category: category,
                buySite: "Ticketmaster SE",
                participants: participants.length > 0 ? participants : ["TBA"],
                fullInfo: event.info || event.pleaseNote || "Full detail unavailable.",
                url: event.url,
                allDateObjects: currentEventDateObj ? [currentEventDateObj] : [] // array to track multidays
            });
        }
    });

    // Formatting the output array
    releases = Array.from(groupedMap.values()).map(item => {
        
        let displayEventDate = "TBA";
        let rawEventTimestamp = Number.MAX_SAFE_INTEGER;

        if (item.allDateObjects.length > 0) {
            // Sort dates from earliest to latest
            item.allDateObjects.sort((a, b) => a - b);
            
            const firstDate = item.allDateObjects[0];
            const lastDate = item.allDateObjects[item.allDateObjects.length - 1];
            
            rawEventTimestamp = firstDate.getTime();

            const shortOptions = { month: 'short', day: 'numeric', year: 'numeric' };

            if (firstDate.getTime() === lastDate.getTime()) {
                 displayEventDate = firstDate.toLocaleDateString(undefined, shortOptions);
            } else {
                 displayEventDate = `${firstDate.toLocaleDateString(undefined, shortOptions)} - ${lastDate.toLocaleDateString(undefined, shortOptions)}`;
            }
        }
        
        item.eventDate = displayEventDate;
        item.rawEventTimestamp = rawEventTimestamp;
        delete item.allDateObjects; // cleanup internal param
        return item;
    });

}


// Authentication Logic
function updateAuthUI() {
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        userGreeting.textContent = `Hi, ${currentUser.username}`;
        navDashboard.classList.remove('hidden');
    } else {
        loginBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
        navDashboard.classList.add('hidden');
        showView('all');
    }
    renderGrids();
}

function handleLogin(e) {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (username) {
        currentUser = {
            username: username,
            trackedIds: []
        };
        localStorage.setItem('ticketTrackerUser', JSON.stringify(currentUser));
        authModal.classList.add('hidden');
        updateAuthUI();
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('ticketTrackerUser');
    updateAuthUI();
}

// Tracking Logic
function toggleTrack(releaseId, updateDetailViewBtn = null) {
    if (!currentUser) {
        authModal.classList.remove('hidden'); 
        return;
    }
    
    const index = currentUser.trackedIds.indexOf(releaseId);
    if (index === -1) {
        currentUser.trackedIds.push(releaseId); 
        if (updateDetailViewBtn) {
            updateDetailViewBtn.classList.add('tracked');
            updateDetailViewBtn.innerHTML = 'Tracking Release \u2713';
        }
    } else {
        currentUser.trackedIds.splice(index, 1);
        if (updateDetailViewBtn) {
            updateDetailViewBtn.classList.remove('tracked');
            updateDetailViewBtn.innerHTML = 'Track This Drop';
        }
    }
    
    localStorage.setItem('ticketTrackerUser', JSON.stringify(currentUser));
    renderGrids();
}

// View Switching
function showView(viewName) {
    viewAll.classList.add('hidden');
    viewDashboard.classList.add('hidden');
    viewEventDetail.classList.add('hidden');
    viewAdmin.classList.add('hidden');

    if (viewName === 'all') {
        currentViewContext = 'all';
        viewAll.classList.remove('hidden');
        navAllReleases.classList.add('active');
        navDashboard.classList.remove('active');
        navAdmin.classList.remove('active');
    } else if (viewName === 'dashboard') {
        currentViewContext = 'dashboard';
        viewDashboard.classList.remove('hidden');
        navAllReleases.classList.remove('active');
        navDashboard.classList.add('active');
        navAdmin.classList.remove('active');
    } else if (viewName === 'admin') {
        currentViewContext = 'admin';
        viewAdmin.classList.remove('hidden');
        navAllReleases.classList.remove('active');
        navDashboard.classList.remove('active');
        navAdmin.classList.add('active');
        renderAdminTable();
    } else if (viewName === 'detail') {
        viewEventDetail.classList.remove('hidden');
        navAllReleases.classList.remove('active');
        navDashboard.classList.remove('active');
        navAdmin.classList.remove('active');
    }
}

function loadEventDetail(releaseId) {
    const item = releases.find(r => r.id === releaseId);
    if (!item) return;

    const calendarIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.5rem;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const locationIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:0.5rem; margin-left:1rem;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;

    dTitle.textContent = item.title;
    dArtist.textContent = item.artist;
    dLocationInfo.innerHTML = `${calendarIcon} ${item.eventDate} ${locationIcon} ${item.location}`;
    dFullInfo.textContent = item.fullInfo;
    
    dParticipants.innerHTML = '';
    item.participants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        dParticipants.appendChild(li);
    });

    dReleaseDate.textContent = item.releaseDate;
    dBuySite.textContent = `Buy on ${item.buySite}`;
    dBuySite.href = item.url; 

    const isTracked = currentUser ? currentUser.trackedIds.includes(item.id) : false;
    if (isTracked) {
        dTrackBtn.classList.add('tracked');
        dTrackBtn.innerHTML = 'Tracking Release \u2713';
    } else {
        dTrackBtn.classList.remove('tracked');
        dTrackBtn.innerHTML = 'Track This Drop';
    }

    const newTrackBtn = dTrackBtn.cloneNode(true);
    dTrackBtn.parentNode.replaceChild(newTrackBtn, dTrackBtn);
    
    const activeTrackBtn = document.getElementById('detail-track-btn');
    activeTrackBtn.addEventListener('click', () => {
        toggleTrack(item.id, activeTrackBtn);
    });

    showView('detail');
    window.scrollTo(0, 0); 
}

// UI Generation
function renderFilters() {
    filterContainer.innerHTML = '';
    
    const cats = ['All Drops', ...Array.from(availableCategories).sort()];
    
    cats.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${cat === currentFilter ? 'active' : ''}`;
        btn.textContent = cat;
        btn.dataset.filter = cat;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = cat;
            renderGrids();
        });
        
        filterContainer.appendChild(btn);
    });
}

function createCardHTML(item, isTracked) {
    const calendarIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    const locationIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    const bellIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`;

    // Ensure description isn't massive from API
    let displayDesc = item.description;
    if(displayDesc && displayDesc.length > 120) {
        displayDesc = displayDesc.substring(0, 120) + "...";
    }

    let hypeBadge = '';
    let dropTextHtml = `Drops: ${item.releaseDate}`;
    
    // Conditionally Render 'Available Now' vs 'Upcoming Drop'
    if (item.daysUntilDrop !== null) {
        if (item.daysUntilDrop < 0) {
             dropTextHtml = `<span style="color: #22c55e; font-weight: 600;">Tickets Available Now</span>`;
             hypeBadge = `<span style="font-size: 0.9em; color: rgba(255,255,255,0.6); margin-left: 0.5rem;">(Dropped ${item.releaseDate})</span>`
        } else if (item.daysUntilDrop <= 5) {
             hypeBadge = `<span style="color: #ef4444; font-weight: bold; margin-left: 0.5rem;" title="Dropping in ${item.daysUntilDrop} days!">🔥</span>`;
        }
    }

    return `
        <span class="event-category">${item.category}</span>
        <div class="release-badge" style="display: flex; align-items: center; gap: 0.4rem;">
            ${bellIcon}
            ${dropTextHtml}
            ${hypeBadge}
        </div>
        <h3 class="event-title">${item.title}</h3>
        <p class="artist-name">${item.artist}</p>
        <div class="event-location" style="margin-bottom: 0.5rem;">
            ${calendarIcon}
            ${item.eventDate}
        </div>
        <div class="event-location">
            ${locationIcon}
            ${item.location}
        </div>
        <p class="event-desc">${displayDesc}</p>
        <button class="track-btn ${isTracked ? 'tracked' : ''}" data-release-id="${item.id}">
            ${isTracked ? 'Tracking Release \u2713' : 'Track This Event'}
        </button>
    `;
}


function renderGrids() {
    allGrid.innerHTML = '';
    trackedGrid.innerHTML = '';
    
    // Safety check mostly if rendering runs before fetch completion
    if(releases.length === 0) {
         if(!loadingSpinner.classList.contains('hidden')) return; // Still loading
         allGrid.innerHTML = `<p class="empty-state">No upcoming ticket drops found.</p>`;
         return;
    }

    const nowTimestamp = new Date().getTime();

    // 1. Filter by List Type (Upcoming vs Released)
    let typeFilteredReleases = releases.filter(item => {
        const dropped = item.rawReleaseTimestamp <= nowTimestamp;
        return currentListType === 'upcoming' ? !dropped : dropped;
    });

    // 2. Filter Custom Categories
    let filteredReleases = typeFilteredReleases.filter(item => {
        if (currentFilter === 'All Drops') return true;
        return item.category === currentFilter;
    });

    // 3. Sort
    filteredReleases.sort((a, b) => {
        if (currentSort === 'releaseDate') {
            return a.rawReleaseTimestamp - b.rawReleaseTimestamp;
        } else {
            return a.rawEventTimestamp - b.rawEventTimestamp;
        }
    });

    // 4. Render 'All Drops' Grid
    filteredReleases.forEach((item, index) => {
        const isTracked = currentUser ? currentUser.trackedIds.includes(item.id) : false;
        const delay = index * 50; 
        
        const card = document.createElement('div');
        card.className = 'event-card';
        card.style.animation = `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${delay}ms`;
        card.style.opacity = '0';
        card.style.cursor = 'pointer'; 
        card.innerHTML = createCardHTML(item, isTracked);
        
        card.addEventListener('click', (e) => {
            if(e.target.closest('.track-btn')) {
                toggleTrack(item.id);
            } else {
                loadEventDetail(item.id);
            }
        });

        allGrid.appendChild(card);
    });

    // 5. Render 'Tracked' Grid
    if (currentUser) {
        // Apply Same Sort to Tracked Grid
        let trackedReleases = releases.filter(item => currentUser.trackedIds.includes(item.id));
        
        trackedReleases.sort((a, b) => {
            if (currentSort === 'releaseDate') {
                return a.rawReleaseTimestamp - b.rawReleaseTimestamp;
            } else {
                return a.rawEventTimestamp - b.rawEventTimestamp;
            }
        });

        if (trackedReleases.length === 0) {
            noTracksMessage.classList.remove('hidden');
        } else {
            noTracksMessage.classList.add('hidden');
            trackedReleases.forEach((item, index) => {
                const delay = index * 50;
                const card = document.createElement('div');
                card.className = 'event-card';
                card.style.animation = `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${delay}ms`;
                card.style.opacity = '0';
                card.style.cursor = 'pointer';
                card.innerHTML = createCardHTML(item, true);
                
                card.addEventListener('click', (e) => {
                    if(e.target.closest('.track-btn')) {
                        toggleTrack(item.id);
                    } else {
                        loadEventDetail(item.id);
                    }
                });

                trackedGrid.appendChild(card);
            });
        }
    }
}

function renderAdminTable() {
    adminTableBody.innerHTML = '';
    
    releases.forEach(item => {
        const tr = document.createElement('tr');
        
        const override = adminOverrides[item.id] || {};
        const catVal = override.category || item.category;
        
        let dtValue = '';
        if (item.rawReleaseTimestamp && item.rawReleaseTimestamp !== Number.MAX_SAFE_INTEGER) {
            const dateObj = new Date(item.rawReleaseTimestamp);
            const tzOffset = dateObj.getTimezoneOffset() * 60000;
            const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
            dtValue = localISOTime;
        }

        tr.innerHTML = `
            <td>
                <strong>${item.title}</strong><br>
                <span style="font-size: 0.85rem; color: var(--text-muted);">${item.artist}</span>
            </td>
            <td>
                <input type="text" class="admin-input cat-input" value="${catVal}" data-id="${item.id}" />
            </td>
            <td>
                <input type="datetime-local" class="admin-input date-input" value="${dtValue}" data-id="${item.id}" />
            </td>
            <td>
                <button class="admin-save-btn" data-id="${item.id}">Save</button>
            </td>
        `;
        
        adminTableBody.appendChild(tr);
    });
    
    document.querySelectorAll('.admin-save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tr = e.target.closest('tr');
            const id = e.target.dataset.id;
            const catInput = tr.querySelector('.cat-input').value.trim();
            const dateInput = tr.querySelector('.date-input').value;
            
            let saveObj = adminOverrides[id] || {};
            saveObj.category = catInput;
            
            if (dateInput) {
                const dateObj = new Date(dateInput);
                saveObj.releaseTimestamp = dateObj.getTime();
                saveObj.releaseDateStr = dateObj.toLocaleDateString() + " - " + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
            
            adminOverrides[id] = saveObj;
            localStorage.setItem('ticketTrackerOverrides', JSON.stringify(adminOverrides));
            
            e.target.textContent = 'Saved!';
            e.target.classList.add('saved');
            setTimeout(() => {
                e.target.textContent = 'Save';
                e.target.classList.remove('saved');
            }, 2000);
            
            // Recompute events data memory structures smoothly without extra API call
            availableCategories.clear();
            mapTicketmasterData(rawTicketmasterEvents);
            renderFilters();
            renderGrids();
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchTicketmasterEvents();
});

loginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => authModal.classList.add('hidden'));
authForm.addEventListener('submit', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

navAllReleases.addEventListener('click', () => showView('all'));
navDashboard.addEventListener('click', () => showView('dashboard'));
navAdmin.addEventListener('click', () => showView('admin'));

backBtn.addEventListener('click', () => showView(currentViewContext));

const listToggleBtns = document.querySelectorAll('.list-toggle-btn');
listToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        listToggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentListType = btn.dataset.type;
        
        // Auto Update sort based on type
        if(currentListType === 'upcoming') {
            currentSort = 'releaseDate';
        } else {
            currentSort = 'eventDate';
        }
        sortSelect.value = currentSort;
        
        renderGrids();
    });
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderGrids();
});
