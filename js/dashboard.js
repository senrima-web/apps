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
        passwordForm: { old: '', new: '', message: '', success: false },
        sessionToken: null,
        isAssetsLoading: false,
        isBonusesLoading: false,
        isModalOpen: false,
        modalMessage: '',

        // --- Inisialisasi Dashboard (Hanya mengambil data pengguna) ---
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
                    // Hapus pemanggilan data aset & bonus dari sini untuk lazy loading
                    if (this.userData.status === 'Wajib Ganti Password') {
                        this.activeView = 'akun';
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
        
        // --- Fungsi untuk Memuat Aset & Bonus (Lazy Loading) ---
        async loadDigitalAssets() {
            // Jika data sudah ada, tidak perlu panggil API lagi
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
            // Jika data sudah ada, tidak perlu panggil API lagi
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

        // --- Fungsi Inti ---
        async callApi(payload) {
            if (!this.sessionToken) {
                this.showModal('Sesi tidak valid.');
                setTimeout(() => this.logout(false), 2000);
                return;
            }
            const headers = { 'Content-Type': 'application/json', 'x-auth-token': this.sessionToken };
            try {
                const response = await fetch(API_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ ...payload, kontrol: 'proteksi' }) });
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
            window.location.href = 'index.html';
        },
        async changePassword() {
            this.passwordForm.message = 'Memproses...';
            const result = await this.callApi({ action: 'changePassword', oldPassword: this.passwordForm.old, newPassword: this.passwordForm.new });
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
