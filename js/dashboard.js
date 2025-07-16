// File: /js/dashboard.js

// ‼️ PASTIKAN URL INI SAMA DENGAN FILE LAINNYA
const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev";

// Fungsi ini akan dipanggil oleh Alpine.js dari dashboard-new.html
function dashboardApp() {
    return {
        // --- Properti untuk menyimpan data ---
        isLoading: true,            // Untuk menampilkan layar loading
        activeView: 'beranda',      // Halaman yang aktif (beranda, aset, akun)
        userData: {},               // Untuk menyimpan data pengguna (nama, email, status)
        menuData: { aset: [] },     // Untuk menyimpan data menu dinamis
        passwordForm: {             // Untuk form ganti password
            old: '',
            new: '',
            message: '',
            success: false
        },
        sessionToken: null,         // Untuk menyimpan token sesi yang didapat dari login

        // --- Fungsi yang akan dijalankan saat dashboard dimuat ---
        async init() {
            // Ambil token sesi dari Session Storage (disimpan setelah verifikasi OTP)
            this.sessionToken = sessionStorage.getItem('appToken');
            
            // Jika tidak ada token, tendang kembali ke halaman login
            if (!this.sessionToken) {
                alert('Akses tidak sah. Silakan login kembali.');
                window.location.href = 'index.html';
                return;
            }

            // Panggil API untuk mendapatkan data awal dashboard
            const response = await this.callApi({ action: 'getDashboardData' });
            
            if (response.status === 'success') {
                // Jika sukses, isi data pengguna dan menu
                this.userData = response.userData;
                this.menuData = response.menuData;
                
                // Jika status pengguna wajib ganti password, langsung buka menu akun
                if (this.userData.status === 'Wajib Ganti Password') {
                    this.activeView = 'akun';
                }
            } else {
                // Jika gagal (misal token kedaluwarsa), logout pengguna
                alert(response.message);
                this.logout(false); // Logout tanpa panggil API
            }
            
            // Sembunyikan layar loading setelah semua data siap
            this.isLoading = false;
        },

        // --- Fungsi untuk memanggil API backend ---
        async callApi(payload) {
            // Selalu sertakan token di header untuk permintaan yang aman
            const headers = { 
                'Content-Type': 'application/json',
                'X-Auth-Token': this.sessionToken 
            };
            
            try {
                const response = await fetch(API_ENDPOINT, { 
                    method: 'POST', 
                    headers, 
                    body: JSON.stringify({ ...payload, kontrol: 'proteksi' }) 
                });
                const result = await response.json();

                // Jika token tidak valid atau sesi berakhir, otomatis logout
                if (result.status === 'error' && (result.message.includes('Token tidak valid') || result.message.includes('Sesi telah berakhir'))) {
                    alert(result.message);
                    this.logout(false);
                }
                return result;
            } catch (e) {
                return { status: 'error', message: 'Koneksi ke server gagal.' };
            }
        },

        // --- Fungsi untuk mengganti password ---
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
                // Reset form dan perbarui status pengguna di tampilan
                this.passwordForm.old = '';
                this.passwordForm.new = '';
                this.userData.status = 'Aktif'; 
            }
        },

        // --- Fungsi untuk logout ---
        async logout(callServer = true) {
            // Kirim perintah logout ke server untuk menghapus token sesi
            if (callServer && this.sessionToken) {
                await this.callApi({ action: 'logout' });
            }
            
            // Hapus semua data dari session storage dan kembali ke halaman login
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
}
