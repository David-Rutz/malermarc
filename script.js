// script.js

// Smooth Scroll for anchor links
const smoothScroll = (target) => {
    document.querySelector(target).scrollIntoView({
        behavior: 'smooth'
    });
};

// Event listener for smooth scrolling on links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        smoothScroll(this.getAttribute('href'));
    });
});

// Contact Form Handling
const contactForm = document.querySelector('#contactForm');
contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(contactForm);
    // simulate form submission, replace with actual submission code
    console.log('Form submitted!', Object.fromEntries(formData));
});

// Scroll Animations
const animateOnScroll = () => {
    const animatedElements = document.querySelectorAll('.animate');
    animatedElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('fade-in');
        }
    });
};
window.addEventListener('scroll', animateOnScroll);

// Active Link Highlighting
const navLinks = document.querySelectorAll('nav a');
const highlightActiveLink = () => {
    const scrollPosition = window.scrollY;
    navLinks.forEach(link => {
        const section = document.querySelector(link.getAttribute('href'));
        if (section.offsetTop <= scrollPosition && section.offsetTop + section.offsetHeight > scrollPosition) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};
window.addEventListener('scroll', highlightActiveLink);