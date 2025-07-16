// File: /js/dashboard.js

const API_ENDPOINT = "https://wmalam.senrima-ms.workers.dev";

function dashboardApp() {
    return {
        isLoading: true,
        activeView: 'beranda',
        userData: {},
        menuData: { aset: [] },
        passwordForm: { old: '', new: '', message: '', success: false },
        sessionToken: null,

        async init() {
            this.sessionToken = sessionStorage.getItem('appToken');
            if (!this.sessionToken) {
                alert('Akses tidak sah. Silakan login kembali.');
                window.location.href = 'index.html';
                return;
            }
            const response = await this.callApi({ action: 'getDashboardData' });
            if (response.status === 'success') {
                this.userData = response.userData;
                this.menuData = response.menuData;
                if (this.userData.status === 'Wajib Ganti Password') {
                    this.activeView = 'akun';
                }
            } else {
                alert(response.message);
                this.logout(false);
            }
            this.isLoading = false;
        },

        async callApi(payload) {
            const headers = { 
                'Content-Type': 'application/json',
                'X-Auth-Token': this.sessionToken 
            };

            // **PERUBAHAN UTAMA DI SINI**
            // Menambahkan kembali parameter 'kontrol' ke setiap payload
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
        },

        async logout(callServer = true) {
            if (callServer && this.sessionToken) {
                await this.callApi({ action: 'logout' });
            }
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }
}
