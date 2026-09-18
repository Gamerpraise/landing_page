// FAQ Toggle
document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
        const item = button.parentElement;
        document.querySelectorAll(".faq-item").forEach(el => {
            if (el !== item) el.classList.remove("active");
        });
        item.classList.toggle("active");
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
        const target = document.querySelector(link.getAttribute("href"));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

// Scroll Reveal with Glitch
const revealElements = document.querySelectorAll(".card, .lesson, .certificate, .faq-item");
const headings = document.querySelectorAll(".hero h1, .section-title h2");
headings.forEach(h => h.setAttribute('data-text', h.textContent));

const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add("show");
            }, i * 150);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });
revealElements.forEach(el => observer.observe(el));

// Random Alien Glitches
function randomGlitch() {
    const targets = document.querySelectorAll('.card, .lesson');
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    if(randomTarget){
        randomTarget.classList.add('glitch');
        setTimeout(() => randomTarget.classList.remove('glitch'), 300);
    }
}
function randomFlicker() {
    const randomHeading = headings[Math.floor(Math.random() * headings.length)];
    if(randomHeading){
        randomHeading.classList.add('flicker');
        setTimeout(() => randomHeading.classList.remove('flicker'), 200);
    }
}
setInterval(randomGlitch, 2000 + Math.random() * 3000);
setInterval(randomFlicker, 3000 + Math.random() * 4000);

// ===========================
// TV SHUTDOWN ON BUTTON CLICK
// ===========================
function tvShutdown(url){
    // Create overlay
    const shutdown = document.createElement('div');
    shutdown.classList.add('tv-shutdown');
    document.body.appendChild(shutdown);
    
    // After animation, go to link
    setTimeout(() => {
        window.location.href = url;
    }, 800); // 0.8s matches CSS animation
}

// Attach to ALL buttons that link to selar
document.querySelectorAll('a[href*="selar.com"]').forEach(btn => {
    btn.addEventListener('click', function(e){
        e.preventDefault(); // stop instant redirect
        const link = this.getAttribute('href');
        tvShutdown(link);
    });
});