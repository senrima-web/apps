// File: /js/dashboard.js (GANTI SEMUA ISI FILE DENGAN INI)

const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev"; // Menggunakan URL Kustom Anda

function dashboardApp() {
    return {
        // --- Properti ---
        isLoading: true,
        isSidebarOpen: false,
        activeView: 'beranda',
        userData: {},
        menuData: { aset: [] },
        passwordForm: { old: '', new: '', message: '', success: false },
        sessionToken: null, // Ini akan menjadi token "hidup" kita

        // --- Inisialisasi Dashboard (Langkah #2 Konsep Anda) ---
        async init() {
            // Ambil token dari parameter URL
            const urlParams = new URLSearchParams(window.location.search);
            const initialToken = urlParams.get('token');

            if (!initialToken) {
                alert('Akses tidak sah. Token tidak ditemukan.');
                window.location.href = 'index.html';
                return;
            }

            // Verifikasi token awal ke server
            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        kontrol: 'proteksi',
                        action: 'getDashboardData', // Kita gunakan action ini untuk verifikasi awal
                        token: initialToken         // Kirim token di body
                    })
                });

                const result = await response.json();

                if (result.status === 'success') {
                    // Jika token valid, simpan token & data, lalu lanjutkan
                    this.sessionToken = initialToken;
                    this.userData = result.userData;
                    this.menuData = result.menuData;
                    if (this.userData.status === 'Wajib Ganti Password') {
                        this.activeView = 'akun';
                    }
                    this.isLoading = false;
                } else {
                    // Jika token tidak valid, tendang ke login
                    alert(result.message);
                    window.location.href = 'index.html';
                }
            } catch (e) {
                alert('Gagal terhubung ke server untuk verifikasi sesi.');
                window.location.href = 'index.html';
            }
        },

        // --- API Call untuk semua aktivitas di dashboard (Langkah #3 Konsep Anda) ---
        async callApi(payload) {
            if (!this.sessionToken) {
                alert('Sesi tidak ditemukan. Mengarahkan kembali ke login.');
                window.location.href = 'index.html';
                return;
            }

            const headers = { 
                'Content-Type': 'application/json',
                'x-auth-token': this.sessionToken // Selalu sertakan token di header
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
                    this.logout(false); // Logout paksa jika token jadi tidak valid
                }
                return result;
            } catch (e) {
                return { status: 'error', message: 'Koneksi ke server gagal.' };
            }
        },

        // --- Fungsi Logout (Langkah #4 Konsep Anda) ---
        async logout(callServer = true) {
            if (callServer) {
                await this.callApi({ action: 'logout' });
            }
            window.location.href = 'index.html';
        },

        // --- Fungsi ganti password (Contoh aktivitas langkah #3) ---
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
