//Versi Stabil 19/07/2025 (Perbaikan)

const API_ENDPOINT = "https://api.senrima.web.id";

function dashboardApp() {
    return {
        // --- Properti ---
        isLoading: true,
        isSidebarOpen: window.innerWidth > 768,
        activeView: 'beranda',
        userData: {},
        digitalAssets: [],
        bonuses: [],
        sessionToken: null,
        isAssetsLoading: false,
        isBonusesLoading: false,
        isModalOpen: false,
        modalMessage: '',
        notificationPreference: '',
        passwordData: { lama: '', baru: '' }, // Ditambahkan untuk form ganti password

        // --- Inisialisasi Dashboard ---
        async init() {
            const urlParams = new URLSearchParams(window.location.search);
            const initialToken = urlParams.get('token');
            if (!initialToken) {
                this.showModal('Akses tidak sah. Token tidak ditemukan.');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return;
            }

            // SIMPAN TOKEN SESI DAHULU
            this.sessionToken = initialToken;
            
            // PANGGIL API SATU KALI SAJA UNTUK DAPAT DATA AWAL
            const result = await this.callApi({ action: 'getDashboardData' });

            if (result.status === 'success') {
                this.userData = result.userData;
                this.notificationPreference = result.userData.notifPreference || 'email';

                if (this.userData.status === 'Wajib Ganti Password') {
                    this.activeView = 'akun';
                    this.showModal('Harap ganti password sementara Anda.');
                }
                this.isLoading = false;
            } else {
                // Penanganan error sudah ada di dalam callApi, jadi di sini cukup log
                console.error("Inisialisasi dashboard gagal.");
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

        // --- Fungsi Aksi Pengguna di Halaman 'Akun Saya' ---
        async updateProfile() {
            this.showModal('Menyimpan perubahan...');
            const response = await this.callApi({
                action: 'updateProfile',
                payload: { 
                    namaBaru: this.userData.nama,
                    usernameBaru: this.userData.username
                }
            });
            this.showModal(response.message || 'Gagal memperbarui profil.');
        },
        async changePassword() {
            if (!this.passwordData.lama || !this.passwordData.baru) {
                this.showModal('Password lama dan baru tidak boleh kosong.');
                return;
            }
            this.showModal('Memproses perubahan password...');
            const response = await this.callApi({
                action: 'changePassword',
                payload: {
                    passwordLama: this.passwordData.lama,
                    passwordBaru: this.passwordData.baru
                }
            });
            this.showModal(response.message || 'Terjadi kesalahan.');
            if (response.status === 'success') {
                this.passwordData = { lama: '', baru: '' };
                document.getElementById('pass-lama').value = '';
                document.getElementById('pass-baru').value = '';
            }
        },
        async startTelegramVerification() {
            this.showModal('Membuat link aman...');
            const response = await this.callApi({ action: 'generateTelegramToken' });
            if (response.status === 'success' && response.token) {
                const telegramLink = `https://t.me/NAMA_BOT_ANDA?start=${response.token}`; // GANTI NAMA_BOT_ANDA
                window.open(telegramLink, '_blank');
                this.showModal('Silakan lanjutkan verifikasi di aplikasi Telegram Anda.');
            } else {
                this.showModal('Gagal membuat link verifikasi. Coba lagi.');
            }
        },
        async saveNotifPreference() {
            this.showModal('Menyimpan preferensi...');
            const response = await this.callApi({
                action: 'updateNotifPreference',
                payload: { preference: this.notificationPreference }
            });
            this.showModal(response.message || 'Gagal menyimpan.');
        },

        // --- Fungsi Inti ---
        async callApi(payload) {
            if (!this.sessionToken) {
                this.showModal('Sesi tidak valid atau telah berakhir.');
                setTimeout(() => this.logout(false), 2000);
                return { status: 'error', message: 'Sesi tidak valid.' };
            }

            const headers = { 
                'Content-Type': 'application/json', 
                'x-auth-token': this.sessionToken // KIRIM TOKEN DI HEADER
            };
            
            // HANYA MENGIRIM PAYLOAD (ACTION, DLL), TIDAK PERLU TOKEN LAGI DI BODY
            const body = JSON.stringify({ ...payload, kontrol: 'proteksi' });
            
            try {
                const response = await fetch(API_ENDPOINT, { method: 'POST', headers, body });
                const result = await response.json();
                
                // Jika token ditolak oleh server, otomatis logout
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
