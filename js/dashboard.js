//Versi Stabil 19/07/2025 (Perbaikan)

function dashboardApp() {
    return {
        userData: {},
        isLoading: true,
        isModalOpen: false,
        isTelegramConnected: false,
        modalMessage: '',
        passwordData: { lama: '', baru: '' }, // Ditambahkan untuk
        activeView: 'beranda',

        // --- Inisialisasi Dashboard ---
        async init() {
            // SIMPAN TOKEN SESI DAHULU
            this.sessionToken = initialToken;
            const result = await this.callApi({ action: 'getDashboardData' });

            if (result.status === 'success') {
                this.userData = result.userData;
                if (this.userData.status === 'Wajib Ganti Password') {
                    this.activeView = 'akun';
                    this.showModal('Harap ganti password sementara Anda.');
                }
            } else {
                // Penanganan error sudah ada di dalam callApi, jadi di
                console.error("Inisialisasi dashboard gagal.");
            }
        },

        // --- Fungsi Inti ---
        async callApi(payload) {
            const urlParams = new URLSearchParams(window.location.search);
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': this.sessionToken
                },
                body: JSON.stringify(payload)
            });
            return await response.json();
        },

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
                const telegramLink = `https://t.me/senrima8n8_bot?start=${response.token}`; //
                // Implementasi lanjut untuk verifikasi Telegram
            }
        },

        showModal(message) {
            this.modalMessage = message;
            this.isModalOpen = true;
        },

        closeModal() {
            this.isModalOpen = false;
            this.modalMessage = '';
        }
    };
}
