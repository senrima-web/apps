const API_ENDPOINT = "https://api.senrima.web.id";

// Otak untuk halaman index.html (Login & Profil)
function app() {
    return {
        view: 'login', isLoading: false, profileData: {},
        loginData: { email: '', password: '' },
        status: { message: '', success: false },
        init() {
            const hash = window.location.hash.substring(1);
            if (hash && hash.startsWith('/')) {
                const username = hash.substring(1);
                if (username) { this.view = 'profile'; this.loadPublicProfile(username); }
            }
        },
        async loadPublicProfile(username) { /* ... (kode tidak berubah) ... */ },
        async login() {
            this.isLoading = true;
            this.status = { message: '', success: false };
            try {
                sessionStorage.setItem('userEmailForOTP', this.loginData.email);
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kontrol: 'proteksi', action: 'requestOTP', email: this.loginData.email, password: this.loginData.password })
                });
                const result = await response.json();
                this.status.message = result.message;
                this.status.success = result.status === 'success';
                if (result.status === 'success') { window.location.href = 'otp.html'; }
            } catch (e) {
                this.status.message = 'Gagal terhubung ke server.';
                this.status.success = false;
            } finally { this.isLoading = false; }
        }
    };
}

// Otak untuk halaman daftar.html
function registrationApp() {
    return {
        isLoading: false,
        formData: { nama: '', email: '', jawaban: '' },
        captcha: { angka1: 0, angka2: 0, question: '' },
        status: { message: '', success: false },
        init() { this.generateCaptcha(); },
        generateCaptcha() {
            this.captcha.angka1 = Math.floor(Math.random() * 10) + 1;
            this.captcha.angka2 = Math.floor(Math.random() * 10) + 1;
            this.captcha.question = `${this.captcha.angka1} + ${this.captcha.angka2}`;
        },
        async submit() {
            this.isLoading = true;
            this.status = { message: '', success: false };
            try {
                const payload = { ...this.formData, ...this.captcha, kontrol: 'proteksi', action: 'register' };
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                this.status.message = result.message;
                this.status.success = result.status === 'success';
                if (!result.status.includes('success')) { this.generateCaptcha(); }
            } catch (e) {
                this.status.message = 'Gagal terhubung ke server.';
                this.status.success = false;
            } finally { this.isLoading = false; }
        }
    };
}

// Otak untuk halaman otp.html
// Di dalam file js/main.js

function otpApp() {
    return {
        isLoading: false,
        otp: '',
        status: { message: '', error: false },
        email: '',

        init() {
            // Mengambil email yang disimpan dari halaman login
            this.email = sessionStorage.getItem('loginEmail');
            if (!this.email) {
                // Jika tidak ada email, paksa kembali ke halaman login
                window.location.href = 'index.html';
            }
        },

        async submit() {
            if (this.otp.length !== 6) {
                this.status = { message: 'OTP harus terdiri dari 6 digit.', error: true };
                return;
            }
            
            this.isLoading = true;
            this.status = { message: '', error: false };

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        kontrol: 'proteksi',
                        action: 'verifyOTP',
                        email: this.email,
                        otp: this.otp
                    })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    // JIKA PENGGUNA BIASA: Arahkan ke dashboard
                    sessionStorage.removeItem('loginEmail');
                    window.location.href = `dashboard-new.html?token=${result.token}`;
                } else if (result.status === 'admin_success') {
                    // JIKA ADMIN: Arahkan ke panel admin
                    sessionStorage.removeItem('loginEmail');
                    window.location.href = `admin.html?token=${result.token}`;
                } else {
                    // Jika ada error lain dari server (misal: OTP salah)
                    this.status = { message: result.message, error: true };
                    this.isLoading = false;
                }

            } catch (e) {
                this.status = { message: 'Koneksi ke server gagal. Coba lagi.', error: true };
                this.isLoading = false;
            }
        }
    };
}

// Otak untuk halaman lupa-password.html
function forgotPasswordApp() {
    return {
        isLoading: false,
        email: '',
        status: { message: '', success: false },
        async submit() {
            this.isLoading = true;
            this.status = { message: '', success: false };
            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ kontrol: 'proteksi', action: 'forgotPassword', email: this.email })
                });
                const result = await response.json();
                this.status.message = result.message;
                this.status.success = result.status === 'success';
            } catch (e) {
                this.status.message = 'Gagal terhubung ke server.';
                this.status.success = false;
            } finally { this.isLoading = false; }
        }
    };
}
