// File: /js/dashboard.js (GANTI SEMUA ISI FILE DENGAN INI)

const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev"; // Menggunakan URL Kustom Anda

function dashboardApp() {
    return {
        // --- Properti ---
        isLoading: true,
        isSidebarOpen: false, // <-- VARIABEL YANG LUPA DITAMBAHKAN
        activeView: 'beranda',
        userData: {},
        menuData: { aset: [] },
        passwordForm: { old: '', new: '', message: '', success: false },
        sessionToken: null,

        // --- Inisialisasi Dashboard ---
        async init() {
            const urlParams = new URLSearchParams(window.location.search);
            const initialToken = urlParams.get('token');

            if (!initialToken) {
                alert('Akses tidak sah. Token tidak ditemukan.');
                window.location.href = 'index.html';
                return;
            }

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        kontrol: 'proteksi',
                        action: 'getDashboardData',
                        token: initialToken
                    })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    this.sessionToken = initialToken;
                    this.userData = result.userData;
                    this.menuData = result.menuData;
                    if (this.userData.status === 'Wajib Ganti Password') {
                        this.activeView = 'akun';
                    }
                    this.isLoading = false;
                } else {
                    alert(result.message);
                    window.location.href = 'index.html';
                }
            } catch (e) {
                alert('Gagal terhubung ke server untuk verifikasi sesi.');
                window.location.href = 'index.html';
            }
        },

        // --- API Call ---
        async callApi(payload) {
            if (!this.sessionToken) {
                alert('Sesi tidak ditemukan. Mengarahkan kembali ke login.');
                window.location.href = 'index.html';
                return;
            }
            const headers = { 
                'Content-Type': 'application/json',
                'x-auth-token': this.sessionToken
            };
            const finalPayload = { ...payload, kontrol: 'proteksi' };
            try {
                const response = await fetch(API_ENDPOINT, { 
                    method: 'POST', 
                    headers, 
                    body: JSON.stringify(finalPayload) 
                });
                const result = await response.json();
                if (result.status === 'error' && (result.message.includes('Token tidak valid') || result.message.includes('Sesi telah berakhir'))) {
                    alert(result.message);
                    this.logout(false);
                }
                return result;
            } catch (e) {
                return { status: 'error', message: 'Koneksi ke server gagal.' };
            }
        },

        // --- Fungsi Logout ---
        async logout(callServer = true) {
            if (callServer) {
                await this.callApi({ action: 'logout' });
            }
            window.location.href = 'index.html';
        },

        // --- Fungsi Ganti Password ---
        async changePassword() {
            this.passwordForm.message = 'Memproses...';
            const payload = { 
                action: 'changePassword', 
                oldPassword: this.passwordForm.old, 
                newPassword: this.passwordForm.new 
            };
            const result = await this.callApi(payload);
            this.passwordForm.message = result.message;
            this.passwordForm.success = result.status === 'success';
            if (result.status === 'success') {
                this.passwordForm.old = '';
                this.passwordForm.new = '';
                this.userData.status = 'Aktif'; 
            }
        }
    }
}
