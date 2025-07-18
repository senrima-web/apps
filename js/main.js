const API_ENDPOINT = "https://api.senrima.web.id";

// ===============================================================
//                       FUNGSI BANTU UMUM
// ===============================================================
function setStatusMessage(message, type, elementId = 'status-message') {
    const statusDiv = document.getElementById(elementId);
    if (!statusDiv) return;
    if (!message) { statusDiv.innerHTML = ''; return; }
    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
    const borderColor = isSuccess ? 'border-green-400' : 'border-red-400';
    const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
    statusDiv.innerHTML = `<div class="p-4 rounded-lg border-l-4 ${bgColor} ${borderColor} ${textColor} text-left"><span class="font-medium">${message}</span></div>`;
}

async function callPublicApi(payload, btnId = null) {
    const btn = btnId ? document.getElementById(btnId) : null;
    const originalText = btn ? btn.textContent : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    }
    setStatusMessage('');
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, kontrol: 'proteksi' })
        });
        const result = await response.json();
        const messageType = result.status.includes('success') ? 'success' : 'error';
        setStatusMessage(result.message, messageType);
        return result;
    } catch (error) {
        setStatusMessage('Error: Gagal terhubung ke server.', 'error');
        return { status: 'network_error' };
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}


// ===============================================================
//                       PEMANDU LALU LINTAS HALAMAN
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';

    switch (page) {
        case 'index.html':
        case '':
            // Tidak perlu melakukan apa-apa, karena halaman ini dikontrol oleh Alpine.js (fungsi app())
            break;
        case 'daftar.html':
            setupRegisterPage();
            break;
        case 'otp.html':
            setupOtpPage();
            break;
        case 'lupa-password.html':
            setupForgotPasswordPage();
            break;
        case 'verifikasi.html':
            setupVerificationPage();
            break;
    }
});


// ===============================================================
//             LOGIKA KHUSUS UNTUK INDEX.HTML (ALPINE.JS)
// ===============================================================
function app() {
    return {
        view: 'login', isLoading: false, profileData: {},
        loginData: { email: '', password: '' },
        status: { message: '', success: false },

        init() {
            const hash = window.location.hash.substring(1);
            if (hash && hash.startsWith('/')) {
                const username = hash.substring(1);
                if (username) {
                    this.view = 'profile';
                    this.loadPublicProfile(username);
                }
            }
        },
        async loadPublicProfile(username) {
            this.isLoading = true;
            try {
                const result = await callPublicApi({ action: 'getPublicProfile', username: username });
                if (result.status === 'success') {
                    this.profileData = result.data;
                } else {
                    this.profileData = { nama: 'Profil Tidak Ditemukan', username: '404' };
                }
            } catch (e) { this.profileData = { nama: 'Gagal Terhubung', username: 'Error' }; } 
            finally { this.isLoading = false; }
        },
        async login() {
            this.isLoading = true;
            this.status = { message: '', success: false };
            try {
                sessionStorage.setItem('userEmailForOTP', this.loginData.email);
                const result = await callPublicApi({ action: 'requestOTP', email: this.loginData.email, password: this.loginData.password });
                this.status.message = result.message;
                this.status.success = result.status === 'success';
                if (result.status === 'success') {
                    window.location.href = 'otp.html';
                }
            } catch (e) {
                this.status.message = 'Gagal terhubung ke server.';
                this.status.success = false;
            } finally {
                this.isLoading = false;
            }
        }
    };
}


// ===============================================================
//         LOGIKA UNTUK HALAMAN LAIN (NON-ALPINE.JS)
// ===============================================================

function setupRegisterPage() {
    const questionEl = document.getElementById('captcha-question');
    const form = document.getElementById('register-form');
    let angka1, angka2;

    // Fungsi untuk membuat soal matematika baru
    function generateCaptcha() {
        angka1 = Math.floor(Math.random() * 10) + 1;
        angka2 = Math.floor(Math.random() * 10) + 1;
        questionEl.textContent = `${angka1} + ${angka2}`;
    }
    generateCaptcha(); // Langsung buat soal saat halaman dimuat

    // Event saat form disubmit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('register-nama').value;
        const email = document.getElementById('register-email').value;
        const jawaban = document.getElementById('register-captcha').value;
        
        const result = await callPublicApi({ action: 'register', nama, email, angka1, angka2, jawaban }, 'register-btn');
        
        // Jika pendaftaran gagal (misal jawaban salah), buat soal baru
        if (result.status !== 'success') {
            generateCaptcha();
        }
    });
}

function setupOtpPage() {
    const email = sessionStorage.getItem('userEmailForOTP');
    if (!email) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('otp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp-code').value;
        const result = await callPublicApi({ action: 'verifyOTP', email, otp }, 'otp-btn');
        if (result.status === 'success' || result.status === 'change_password_required') {
            const token = result.token;
            if (token) {
                sessionStorage.removeItem('userEmailForOTP');
                window.location.href = `dashboard-new.html?token=${token}`;
            } else {
                setStatusMessage('Gagal mendapatkan token sesi dari server.', 'error');
            }
        }
    });
}

function setupForgotPasswordPage() {
    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await callPublicApi({ action: 'forgotPassword', email: document.getElementById('forgot-email').value }, 'forgot-btn');
    });
}

function setupVerificationPage() {
    // Ambil token dari URL
    const token = new URLSearchParams(window.location.search).get('token');
    
    // Jika tidak ada token, tampilkan error
    if (!token) {
        document.getElementById('main-title').textContent = 'Error!';
        setStatusMessage('Token verifikasi tidak ditemukan.', 'error');
        return;
    }

    // Panggil API untuk memverifikasi token
    (async () => {
        const result = await callPublicApi({ action: 'verifyEmail', token });
        if (result.status === 'success') {
            document.getElementById('main-title').textContent = 'Verifikasi Berhasil!';
            // Arahkan ke halaman login setelah 3 detik
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        } else {
             document.getElementById('main-title').textContent = 'Verifikasi Gagal!';
        }
    })();
}
