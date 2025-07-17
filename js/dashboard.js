// File: /js/dashboard.js

const API_ENDPOINT = "https://api.senrima.web.id";

function dashboardApp() {
    return {
        // --- Properti ---
        isLoading: true,
        isSidebarOpen: false,
        activeView: 'beranda',
        userData: {},
        menuData: { aset: [] },
        passwordForm: { old: '', new: '', message: '', success: false },
        sessionToken: null,
        digitalAssets: [],
        isAssetsLoading: false,
        isModalOpen: false,
        modalMessage: '',

        // --- Inisialisasi Dashboard ---
        async init() {
            const urlParams = new URLSearchParams(window.location.search);
            const initialToken = urlParams.get('token');

            if (!initialToken) {
                this.showModal('Akses tidak sah. Token tidak ditemukan.');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return;
            }

            // HANYA SATU KALI PANGGILAN API UNTUK SEMUA DATA
            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kontrol: 'proteksi', action: 'getDashboardData', token: initialToken })
                });
                const result = await response.json();
                if (result.status === 'success') {
                    this.sessionToken = initialToken;
                    this.userData = result.userData;
                    this.digitalAssets = result.digitalAssets; // Langsung isi data aset dari sini
                    if (this.userData.status === 'Wajib Ganti Password') {
                        this.activeView = 'akun';
                    }
                    this.isLoading = false;
                } else {
                    this.showModal(result.message);
                    setTimeout(() => window.location.href = 'index.html', 2000);
                }
            } catch (e) {
                this.showModal('Gagal terhubung ke server untuk verifikasi sesi.');
                setTimeout(() => window.location.href = 'index.html', 2000);
            }
        },

        // --- Fungsi Notifikasi Kustom ---
        showModal(message) {
            this.modalMessage = message;
            this.isModalOpen = true;
        },
        

        // --- API Call ---
        async callApi(payload) {
            if (!this.sessionToken) {
                this.showModal('Sesi tidak ditemukan. Mengarahkan kembali ke login.');
                setTimeout(() => this.logout(false), 2000);
                return;
            }
            const headers = { 'Content-Type': 'application/json', 'x-auth-token': this.sessionToken };
            const finalPayload = { ...payload, kontrol: 'proteksi' };
            try {
                const response = await fetch(API_ENDPOINT, { method: 'POST', headers, body: JSON.stringify(finalPayload) });
                const result = await response.json();
                if (result.status === 'error' && (result.message.includes('Token tidak valid') || result.message.includes('Sesi telah berakhir'))) {
                    this.showModal(result.message);
                    setTimeout(() => this.logout(false), 2000);
                }
                return result;
            } catch (e) {
                return { status: 'error', message: 'Koneksi ke server gagal.' };
            }
        },

        // --- Fungsi Logout ---
        async logout(callServer = true) {
            // Jika callServer true, kirim perintah ke backend untuk hapus token
            if (callServer && this.sessionToken) {
                await this.callApi({ action: 'logout' });
            }
            // Selalu arahkan ke halaman login setelahnya
            window.location.href = 'index.html';
        },

        // --- Fungsi Ganti Password ---
        async changePassword() {
            this.passwordForm.message = 'Memproses...';
            const payload = { action: 'changePassword', oldPassword: this.passwordForm.old, newPassword: this.passwordForm.new };
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
