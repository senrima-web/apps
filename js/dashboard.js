// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
 const userEmailSpan = document.getElementById('user-email');
 const logoutBtn = document.getElementById('logout-btn');
 const menuList = document.getElementById('menu-list');


 // Fungsi untuk mendapatkan token dari session storage (contoh)
 function getToken() {
 return sessionStorage.getItem('token');
 }


 const token = getToken();
 if (!token) {
 window.location.href = '/'; // Redirect ke halaman login jika tidak ada token
 return;
 }


 // Contoh data user (akan diganti dengan pemanggilan API nanti)
 const user = {
 email: 'user@example.com'
 };


 if (userEmailSpan) {
 userEmailSpan.textContent = user.email;
 }


 // Contoh menu (akan diganti dengan data dinamis dari backend)
 const menuItems = [
 { text: 'Profil', url: '#' },
 { text: 'Pengaturan', url: '#' }
 ];


 if (menuList && menuItems) {
 menuItems.forEach(item => {
 const li = document.createElement('li');
 const a = document.createElement('a');
 a.href = item.url;
 a.textContent = item.text;
 li.appendChild(a);
 menuList.appendChild(li);
 });
 }


 if (logoutBtn) {
 logoutBtn.addEventListener('click', () => {
 // Hapus token dari penyimpanan (contoh session storage)
 sessionStorage.removeItem('token');
 // Redirect ke halaman login
 window.location.href = '/';
 });
 }


 // Di sini Anda akan menambahkan logika untuk memanggil API
 // menggunakan token untuk mendapatkan data dashboard yang sebenarnya.
});