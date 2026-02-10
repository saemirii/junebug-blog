// Initialize Supabase client
// Use a window-scoped client to avoid redeclaration errors if the script is re-evaluated
window.supabaseClient = window.supabaseClient || null;
let poems = [];
let selectedTags = [];
let selectedPoemTags = [];
let currentSort = 'newest';

// Initialize the application
async function initializeApp() {
    try {
        // Initialize Supabase with config (only if not already initialized)
        if (!window.supabaseClient) {
            if (!window.supabase || typeof window.supabase.createClient !== 'function') {
                throw new Error('Supabase SDK not loaded. Make sure the <script> tag for @supabase/supabase-js is included.');
            }
            window.supabaseClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
        }

        // Load poems from database
        await loadPoems();
        
        // Update home stats
        updateHomeStats();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error loading poems. Please refresh the page.', 'error');
    }
}

// Load poems from Supabase
async function loadPoems() {
    showLoading(true);
    try {
        const { data, error } = await window.supabaseClient
            .from('poems')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        poems = data || [];
        renderPoems();
    } catch (error) {
        console.error('Error loading poems:', error);
        showToast('Error loading poems from database', 'error');
    } finally {
        showLoading(false);
    }
}

// Show/hide loading indicator
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

// Update home page statistics
function updateHomeStats() {
    const totalPoemsEl = document.getElementById('total-poems');
    const latestDateEl = document.getElementById('latest-date');
    
    if (totalPoemsEl) {
        totalPoemsEl.textContent = poems.length;
    }
    
    if (latestDateEl && poems.length > 0) {
        const latestPoem = poems[0];
        const date = new Date(latestPoem.created_at);
        latestDateEl.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// Page navigation
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageName + '-page').classList.add('active');
    
    if (pageName === 'poems') {
        renderPoems();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Get tag color class
function getTagClass(tag) {
    const tagColors = {
        'poem': 'tag-poem',
        'prose': 'tag-prose',
        'free-verse': 'tag-free-verse',
        'structured': 'tag-structured'
    };
    return tagColors[tag] || 'tag-poem';
}

// Sort poems
function sortPoems(poemsToSort) {
    const sorted = [...poemsToSort];
    
    switch(currentSort) {
        case 'newest':
            sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'title':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    return sorted;
}

// Change sort order
function changeSortOrder(button) {
    const sortButtons = document.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    currentSort = button.dataset.sort;
    renderPoems();
}

// Render poems
function renderPoems() {
    const grid = document.getElementById('poems-grid');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    
    // Filter poems
    let filtered = poems.filter(poem => {
        const matchesSearch = poem.title.toLowerCase().includes(searchQuery) || 
                            poem.content.toLowerCase().includes(searchQuery);
        const matchesTags = selectedTags.length === 0 || 
                          poem.tags.some(tag => selectedTags.includes(tag));
        return matchesSearch && matchesTags;
    });
    
    // Sort poems
    filtered = sortPoems(filtered);
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = `${filtered.length} poem${filtered.length !== 1 ? 's' : ''} found`;
    }
    
    // Show empty state or grid
    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        
        grid.innerHTML = filtered.map(poem => {
            const primaryTag = poem.tags[0];
            const tagClass = getTagClass(primaryTag);
            const preview = poem.preview || poem.content.substring(0, 200) + (poem.content.length > 200 ? '...' : '');
            const date = new Date(poem.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            
            return `
                <div class="poem-card ${tagClass}" onclick="showPoemDetail(${poem.id})">
                    <div class="poem-card-header">
                        <h3>${escapeHtml(poem.title)}</h3>
                        <span class="poem-date">${date}</span>
                    </div>
                    <div class="poem-tags">
                        ${poem.tags.map(tag => `<span class="poem-tag ${getTagClass(tag)}">${tag}</span>`).join('')}
                    </div>
                    <div class="poem-preview">${escapeHtml(preview)}</div>
                    <span class="read-more">Read more →</span>
                </div>
            `;
        }).join('');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show poem detail
function showPoemDetail(poemId) {
    const poem = poems.find(p => p.id === poemId);
    if (!poem) return;
    
    const content = document.getElementById('poem-detail-content');
    const date = new Date(poem.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    content.innerHTML = `
        <div class="poem-detail">
            <h1>${escapeHtml(poem.title)}</h1>
            <div class="poem-meta">
                <span class="poem-date-detail">${date}</span>
            </div>
            <div class="poem-tags">
                ${poem.tags.map(tag => `<span class="poem-tag ${getTagClass(tag)}">${tag}</span>`).join('')}
            </div>
            <div class="poem-full-content">${escapeHtml(poem.content)}</div>
        </div>
    `;
    
    showPage('poem-detail');
}

// Filter poems
function filterPoems() {
    renderPoems();
}

function toggleTagFilter(button) {
    const tag = button.dataset.tag;
    if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
        button.classList.remove('active');
    } else {
        selectedTags.push(tag);
        button.classList.add('active');
    }
    renderPoems();
}

function clearFilters() {
    selectedTags = [];
    document.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('search-input').value = '';
    renderPoems();
}

// Password modal
function showPasswordModal() {
    document.getElementById('password-modal').classList.add('active');
    document.getElementById('password-input').focus();
}

function closePasswordModal() {
    document.getElementById('password-modal').classList.remove('active');
    document.getElementById('password-input').value = '';
    document.getElementById('password-error').textContent = '';
}

function checkPassword() {
    const password = document.getElementById('password-input').value;
    const errorEl = document.getElementById('password-error');
    
    if (password === CONFIG.adminPassword) {
        closePasswordModal();
        showSubmitModal();
    } else {
        errorEl.textContent = 'Incorrect password. Please try again.';
        document.getElementById('password-input').value = '';
    }
}

// Submit modal
function showSubmitModal() {
    document.getElementById('submit-modal').classList.add('active');
}

function closeSubmitModal() {
    document.getElementById('submit-modal').classList.remove('active');
    document.getElementById('poem-title').value = '';
    document.getElementById('poem-content').value = '';
    selectedPoemTags = [];
    document.querySelectorAll('.tag-select-btn').forEach(btn => btn.classList.remove('selected'));
}

function togglePoemTag(button) {
    const tag = button.dataset.tag;
    if (selectedPoemTags.includes(tag)) {
        selectedPoemTags = selectedPoemTags.filter(t => t !== tag);
        button.classList.remove('selected');
    } else {
        selectedPoemTags.push(tag);
        button.classList.add('selected');
    }
}

// Submit poem to Supabase
async function submitPoem() {
    const title = document.getElementById('poem-title').value.trim();
    const content = document.getElementById('poem-content').value.trim();
    
    if (!title || !content || selectedPoemTags.length === 0) {
        showToast('Please fill in all fields and select at least one tag.', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const preview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
        
        const { data, error } = await window.supabaseClient
            .from('poems')
            .insert([
                {
                    title: title,
                    content: content,
                    preview: preview,
                    tags: selectedPoemTags
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Reload poems from database
        await loadPoems();
        
        closeSubmitModal();
        showToast('Poem submitted successfully! ✨', 'success');
        
        // Show the poems page
        showPage('poems');
        
    } catch (error) {
        console.error('Error submitting poem:', error);
        showToast('Error submitting poem. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('success-toast');
    const messageEl = document.getElementById('toast-message');
    
    messageEl.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        closePasswordModal();
        closeSubmitModal();
    }
    
    // Enter in password modal
    if (e.key === 'Enter' && document.getElementById('password-modal').classList.contains('active')) {
        checkPassword();
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    showPage('home');
});