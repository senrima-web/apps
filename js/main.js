// ===============================================================
//                       PENGATURAN PENTING & FUNGSI BANTU
// ===============================================================
// ‼️ PASTIKAN URL INI SAMA DENGAN YANG ADA DI FILE HTML LAINNYA
const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev";

/**
 * Menampilkan pesan status kepada pengguna.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {'success' | 'error'} type - Jenis pesan (untuk styling).
 * @param {string} elementId - ID elemen div untuk menampilkan status.
 */
function setStatusMessage(message, type, elementId = 'status-message') {
    const statusDiv = document.getElementById(elementId);
    if (!statusDiv) return;
    
    // Bersihkan pesan jika tidak ada pesan baru
    if (!message) {
        statusDiv.innerHTML = '';
        return;
    }

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
    const borderColor = isSuccess ? 'border-green-400' : 'border-red-400';
    const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
    statusDiv.innerHTML = `<div class="p-4 rounded-lg border-l-4 ${bgColor} ${borderColor} ${textColor} text-left"><span class="font-medium">${message}</span></div>`;
}


// ===============================================================
//                       LOGIKA UTAMA SAAT HALAMAN DIMUAT
// ===============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Mendeteksi halaman mana yang sedang aktif berdasarkan nama filenya
    const page = window.location.pathname.split('/').pop() || 'index.html';

    switch (page) {
        case 'index.html':
        case '': // Untuk root path
            setupLoginPage();
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
        // Tidak ada lagi case untuk 'reset.html' karena sudah mandiri
    }
});


// ===============================================================
//          FUNGSI SETUP UNTUK HALAMAN-HALAMAN PUBLIK
// ===============================================================

/**
 * Fungsi umum untuk memanggil API publik dan menangani status loading tombol.
 * @param {object} payload - Data yang akan dikirim ke API.
 * @param {string} btnId - ID tombol submit untuk menampilkan loading.
 * @returns {Promise<object>} Hasil JSON dari API.
 */
async function callPublicApi(payload, btnId) {
    const btn = document.getElementById(btnId);
    const originalText = btn ? btn.textContent : '';
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    }
    setStatusMessage(''); // Bersihkan pesan status lama

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        // Tentukan tipe pesan berdasarkan status dari backend
        const messageType = result.status.includes('success') || result.status.includes('change_password_required') ? 'success' : 'error';
        setStatusMessage(result.message, messageType);
        
        return result;
    } catch (error) {
        setStatusMessage('Error: Gagal terhubung ke server. Periksa koneksi Anda.', 'error');
        return { status: 'network_error' };
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
}

function setupLoginPage() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Simpan email untuk digunakan di halaman OTP
        sessionStorage.setItem('userEmailForOTP', email);
        
        const result = await callPublicApi({ action: 'requestOTP', email, password }, 'login-btn');
        if (result.status === 'success') {
            window.location.href = 'otp.html';
        }
    });
}

function setupRegisterPage() {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('register-nama').value;
        const email = document.getElementById('register-email').value;
        
        const result = await callPublicApi({ action: 'register', nama, email }, 'register-btn');
        if (result.status === 'success') {
            // Beri jeda agar pengguna bisa membaca pesan sukses sebelum diarahkan
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        }
    });
}

function setupOtpPage() {
    const email = sessionStorage.getItem('userEmailForOTP');
    if (!email) {
        // Jika tidak ada email, paksa kembali ke halaman login
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('otp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp-code').value;
        
        const result = await callPublicApi({ action: 'verifyOTP', email, otp }, 'otp-btn');
        if (result.status === 'success' || result.status === 'change_password_required') {
            // Hapus email dari session setelah berhasil
            sessionStorage.removeItem('userEmailForOTP');
            // Arahkan ke dashboard baru
            window.location.href = 'dashboard-new.html';
        }
    });
}

function setupForgotPasswordPage() {
    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await callPublicApi({ action: 'forgotPassword', email: document.getElementById('forgot-email').value }, 'forgot-btn');
    });
}
