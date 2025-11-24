const API_BASE = window.location.origin;
let token = localStorage.getItem('token');

// Auth functions
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showMessage('Login successful!', 'success');
            setTimeout(() => {
                document.getElementById('authSection').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                loadBeneficiaries();
            }, 1000);
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
}

async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showMessage('Registration successful!', 'success');
            setTimeout(() => {
                document.getElementById('authSection').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                loadBeneficiaries();
            }, 1000);
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Connection error', 'error');
    }
}

function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
}

function showMessage(message, type) {
    const msgEl = document.getElementById('authMessage');
    msgEl.textContent = message;
    msgEl.className = `message show ${type}`;
    setTimeout(() => {
        msgEl.className = 'message';
    }, 5000);
}

// Navigation
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const section = document.getElementById(sectionName);
    if (section) {
        section.style.display = 'block';
        section.classList.add('active');
    }
    
    const btn = document.querySelector(`[data-section="${sectionName}"]`);
    if (btn) btn.classList.add('active');
    
    // Load data for the section
    switch(sectionName) {
        case 'beneficiaries':
            loadBeneficiaries();
            break;
        case 'notices':
            loadNotices();
            break;
        case 'disputes':
            loadDisputes();
            break;
        case 'billing':
            loadBillingAlerts();
            break;
    }
}

// API calls
async function loadBeneficiaries() {
    const list = document.getElementById('beneficiariesList');
    list.innerHTML = '<div class="loading">Loading beneficiaries...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/beneficiaries`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.beneficiaries) {
            if (data.beneficiaries.length === 0) {
                list.innerHTML = '<div class="empty-state"><h3>No beneficiaries yet</h3><p>Add your first beneficiary to get started</p></div>';
            } else {
                list.innerHTML = data.beneficiaries.map(b => `
                    <div class="item">
                        <h3>${b.name}</h3>
                        <p><strong>Email:</strong> ${b.email}</p>
                        <p><strong>Relationship:</strong> ${b.relationship}</p>
                        ${b.phone ? `<p><strong>Phone:</strong> ${b.phone}</p>` : ''}
                    </div>
                `).join('');
            }
        } else {
            list.innerHTML = '<div class="empty-state"><p>Unable to load beneficiaries</p></div>';
        }
    } catch (error) {
        list.innerHTML = '<div class="empty-state"><p>Connection error</p></div>';
    }
}

async function loadNotices() {
    const list = document.getElementById('noticesList');
    list.innerHTML = '<div class="loading">Loading trust notices...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/notices`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.notices) {
            if (data.notices.length === 0) {
                list.innerHTML = '<div class="empty-state"><h3>No trust notices</h3><p>Create your first notice</p></div>';
            } else {
                list.innerHTML = data.notices.map(n => `
                    <div class="item">
                        <h3>${n.title}</h3>
                        <p>${n.description}</p>
                        <p>
                            <span class="badge badge-${getStatusColor(n.status)}">${n.status}</span>
                            <span class="badge badge-info">${n.notice_type}</span>
                        </p>
                    </div>
                `).join('');
            }
        } else {
            list.innerHTML = '<div class="empty-state"><p>Unable to load notices</p></div>';
        }
    } catch (error) {
        list.innerHTML = '<div class="empty-state"><p>Connection error</p></div>';
    }
}

async function loadDisputes() {
    const list = document.getElementById('disputesList');
    list.innerHTML = '<div class="loading">Loading disputes...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/disputes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.disputes) {
            if (data.disputes.length === 0) {
                list.innerHTML = '<div class="empty-state"><h3>No disputes</h3><p>File a dispute if needed</p></div>';
            } else {
                list.innerHTML = data.disputes.map(d => `
                    <div class="item">
                        <h3>${d.title}</h3>
                        <p>${d.description}</p>
                        <p>
                            <span class="badge badge-${getStatusColor(d.status)}">${d.status}</span>
                            <span class="badge badge-${getPriorityColor(d.priority)}">${d.priority} priority</span>
                        </p>
                    </div>
                `).join('');
            }
        } else {
            list.innerHTML = '<div class="empty-state"><p>Unable to load disputes</p></div>';
        }
    } catch (error) {
        list.innerHTML = '<div class="empty-state"><p>Connection error</p></div>';
    }
}

async function loadBillingAlerts() {
    const list = document.getElementById('billingList');
    list.innerHTML = '<div class="loading">Loading billing alerts...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/billing`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.billing_alerts) {
            if (data.billing_alerts.length === 0) {
                list.innerHTML = '<div class="empty-state"><h3>No billing alerts</h3><p>Create an alert to track payments</p></div>';
            } else {
                list.innerHTML = data.billing_alerts.map(b => `
                    <div class="item">
                        <h3>${b.title}</h3>
                        <p>${b.description}</p>
                        <p><strong>Amount:</strong> $${(b.amount / 100).toFixed(2)}</p>
                        <p>
                            <span class="badge badge-${getStatusColor(b.status)}">${b.status}</span>
                            <span class="badge badge-info">${b.alert_type}</span>
                        </p>
                    </div>
                `).join('');
            }
        } else {
            list.innerHTML = '<div class="empty-state"><p>Unable to load billing alerts</p></div>';
        }
    } catch (error) {
        list.innerHTML = '<div class="empty-state"><p>Connection error</p></div>';
    }
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'sent': 'info',
        'acknowledged': 'success',
        'expired': 'danger',
        'open': 'warning',
        'in_progress': 'info',
        'resolved': 'success',
        'closed': 'success',
        'active': 'warning',
        'dismissed': 'info'
    };
    return colors[status] || 'info';
}

function getPriorityColor(priority) {
    const colors = {
        'low': 'info',
        'medium': 'warning',
        'high': 'warning',
        'critical': 'danger'
    };
    return colors[priority] || 'info';
}

function showCreateForm(type) {
    alert(`Create ${type} form - To be implemented with proper forms`);
}

// Check if already logged in
if (token) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadBeneficiaries();
}
