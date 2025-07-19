//Versi Stabil 18/07/2025

const API_ENDPOINT = "https://api.senrima.web.id";

function dashboardApp() {
    return {
        // --- Properti ---
        isLoading: true,
        isSidebarOpen: false,
        activeView: 'beranda',
        userData: {},
        digitalAssets: [],
        bonuses: [],
        sessionToken: null,
        isAssetsLoading: false,
        isBonusesLoading: false,
        isModalOpen: false,
        isTelegramConnected: false,
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
                    if (this.userData.status === 'Wajib Ganti Password') {
                        this.activeView = 'akun'; // Arahkan ke akun untuk ganti password awal
                    }
                    this.isLoading = false;
                } else {
                    this.showModal(result.message);
                    setTimeout(() => window.location.href = 'index.html', 2000);
                }
            } catch (e) {
                this.showModal('Gagal verifikasi sesi.');
                setTimeout(() => window.location.href = 'index.html', 2000);
            }
        },

        // --- Fungsi Notifikasi Kustom ---
        showModal(message) {
            this.modalMessage = message;
            this.isModalOpen = true;
        },
        
        // --- Fungsi untuk Memuat Data (Lazy Loading) ---
        async loadDigitalAssets() {
            if (this.digitalAssets.length > 0) return;
            this.isAssetsLoading = true;
            const response = await this.callApi({ action: 'getAsetDigital' });
            if (response.status === 'success') {
                this.digitalAssets = response.data;
            } else {
                this.showModal('Gagal memuat Aset Digital.');
            }
            this.isAssetsLoading = false;
        },
        async loadBonuses() {
            if (this.bonuses.length > 0) return;
            this.isBonusesLoading = true;
            const response = await this.callApi({ action: 'getBonus' });
            if (response.status === 'success') {
                this.bonuses = response.data;
            } else {
                this.showModal('Gagal memuat Bonus.');
            }
            this.isBonusesLoading = false;
        },

        async checkConnectionStatus() {
            this.showModal('Memeriksa status koneksi...');
            const response = await this.callApi({ action: 'getConnectionStatus' });
    
            if (response.status === 'success') {
                this.userData.isTelegramConnected = response.isTelegramConnected;
                if (response.isTelegramConnected) {
                    this.showModal('Sukses! Akun Telegram sudah terhubung.');
                } else {
                    this.showModal('Akun Telegram masih belum terhubung.');
                }
            } else {
                this.showModal('Gagal memeriksa status.');
            }
        },

        // --- Fungsi Inti ---
        async callApi(payload) {
            const urlParams = new URLSearchParams(window.location.search);
            const initialToken = urlParams.get('token');
            if (!this.sessionToken) {
                this.showModal('Sesi tidak valid.');
                setTimeout(() => this.logout(false), 2000);
                return;
            }
            const headers = { 'Content-Type': 'application/json', 'x-auth-token': this.sessionToken };
            const body = JSON.stringify({ ...payload, kontrol: 'proteksi', token: initialToken });
            try {
                const response = await fetch(API_ENDPOINT, { method: 'POST', headers, body });
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
        async logout(callServer = true) {
            if (callServer) await this.callApi({ action: 'logout' });
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
}
