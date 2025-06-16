const eventDate = new Date('November 4, 2025 00:00:00').getTime();
function updateCountdown() {
    const now = new Date().getTime();
    const timeRemaining = eventDate - now;

    const days = Math.max(Math.floor(timeRemaining / (1000 * 60 * 60 * 24)), 0);
    const hours = Math.max(Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 0);
    const minutes = Math.max(Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)), 0);
    const seconds = Math.max(Math.floor((timeRemaining % (1000 * 60)) / 1000), 0);

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);
