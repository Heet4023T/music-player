document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    
    // Check saved theme from localStorage
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Apply saved theme on page load
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.replace('bi-moon-fill', 'bi-sun-fill');
    }
    
    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        
        // Update localStorage with current theme
        if (document.body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
            themeIcon.classList.replace('bi-moon-fill', 'bi-sun-fill');
        } else {
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.replace('bi-sun-fill', 'bi-moon-fill');
        }
    });
});