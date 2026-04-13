document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
    // ========================================
    // CONTEXT AWARE PERSONALIZATION
    // ========================================
    const initPersonalization = () => {
        const month = new Date().getMonth();
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (!heroSubtitle) return;

        const seasons = {
            winter: [11, 0, 1],
            spring: [2, 3, 4],
            summer: [5, 6, 7],
            autumn: [8, 9, 10]
        };

        if (seasons.winter.includes(month)) heroSubtitle.textContent = 'Winter Season 2024';
        else if (seasons.summer.includes(month)) heroSubtitle.textContent = 'Alpine Summer Retreat';
        else heroSubtitle.textContent = 'The Mountain Sanctuary';
    };
    initPersonalization();

    // ========================================
    // NAVBAR & SCROLL PHYSICS
    // ========================================
    const navbar = document.querySelector('.navbar');

    // Throttled scroll handler for performance
    let lastScroll = 0;
    const scrollHandler = () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = currentScroll;
    };

    window.addEventListener('scroll', () => {
        requestAnimationFrame(scrollHandler);
    });

    // ========================================
    // CINEMATIC SCROLL REVEALS
    // ========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Don't unobserve immediately if we want to add delays, or we can just let css handle it
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply staggered delays to elements inside sections
    document.querySelectorAll('section').forEach(section => {
        const revealElements = section.querySelectorAll('h2, h3, p, .gallery-item, .feature-pill, .location-item, .about-image-container img, .amenity-minimal');
        revealElements.forEach((el, index) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${index * 0.1}s`;
            revealObserver.observe(el);
        });
    });

    // CSS for reveal
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .reveal.in-view {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(styleSheet);

    // ========================================
    // DARK MODE - PREFERENCE & STATE
    // ========================================
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // Check system preference first if no local storage
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('darkMode');

    if (savedMode === 'true' || (savedMode === null && systemPrefersDark)) {
        body.classList.add('dark-mode');
    }

    darkModeToggle?.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);

        // Slight rotation animation for icon
        const svg = darkModeToggle.querySelector('svg');
        if (svg) {
            svg.style.transform = 'rotate(360deg)';
            svg.style.transition = 'transform 0.5s ease';
            setTimeout(() => svg.style.transform = 'none', 500);
        }
    });

    // ========================================
    // CALENDAR CORE LOGIC
    // ========================================
    const calendarGrid = document.querySelector('.calendar-grid');
    const currentMonthElement = document.querySelector('.current-month');
    const prevBtn = document.querySelector('.prev-month');
    const nextBtn = document.querySelector('.next-month');

    // Booking Inputs (Floating Bar)
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const summaryCheckIn = document.getElementById('summaryCheckIn');
    const summaryCheckOut = document.getElementById('summaryCheckOut');
    const summaryTotal = document.getElementById('summaryTotal');

    let currentDate = new Date();
    let selectedCheckIn = null;
    let selectedCheckOut = null;
    const basePrice = 120; // Winter rate

    // Generate random booked dates for realism
    const bookedDates = new Set();
    const today = new Date();
    for (let i = 0; i < 8; i++) {
        const randomDay = new Date(today);
        randomDay.setDate(today.getDate() + 5 + Math.floor(Math.random() * 45));
        bookedDates.add(randomDay.toDateString());
    }

    function renderCalendar(date) {
        if (!calendarGrid) return;

        // Clear grid but keep headers
        const weekHeader = Array.from(calendarGrid.querySelectorAll('.weekday'));
        calendarGrid.innerHTML = '';
        weekHeader.forEach(h => calendarGrid.appendChild(h));

        const year = date.getFullYear();
        const month = date.getMonth();

        // Update Month Label
        currentMonthElement.textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

        const firstDayIndex = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Padding Days
        for (let i = 0; i < firstDayIndex; i++) {
            const empty = document.createElement('div');
            empty.className = 'day empty';
            calendarGrid.appendChild(empty);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = i;

            const thisDate = new Date(year, month, i);
            const dateStr = thisDate.toDateString();

            // Status Classes
            if (bookedDates.has(dateStr)) dayEl.classList.add('booked');

            // Selection Logic
            if (selectedCheckIn && dateStr === selectedCheckIn.toDateString()) dayEl.classList.add('selected');
            if (selectedCheckOut && dateStr === selectedCheckOut.toDateString()) dayEl.classList.add('selected');

            // Range Logic
            if (selectedCheckIn && selectedCheckOut) {
                if (thisDate > selectedCheckIn && thisDate < selectedCheckOut) {
                    dayEl.classList.add('in-range');
                }
            }

            // Interaction
            if (!dayEl.classList.contains('booked')) {
                dayEl.addEventListener('click', () => handleDateClick(thisDate));
            }

            calendarGrid.appendChild(dayEl);
        }
    }

    function handleDateClick(date) {
        if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
            selectedCheckIn = date;
            selectedCheckOut = null;
        } else if (date > selectedCheckIn) {
            selectedCheckOut = date;
        } else {
            selectedCheckIn = date;
            selectedCheckOut = null;
        }

        updateUI();
        renderCalendar(currentDate);
    }

    function updateUI() {
        // Update Floating Inputs
        if (selectedCheckIn) {
            checkInInput.valueAsDate = new Date(Date.UTC(selectedCheckIn.getFullYear(), selectedCheckIn.getMonth(), selectedCheckIn.getDate()));
            summaryCheckIn.textContent = selectedCheckIn.toLocaleDateString();
        }
        if (selectedCheckOut) {
            checkOutInput.valueAsDate = new Date(Date.UTC(selectedCheckOut.getFullYear(), selectedCheckOut.getMonth(), selectedCheckOut.getDate()));
            summaryCheckOut.textContent = selectedCheckOut.toLocaleDateString();
        }

        // Calculate Price
        if (selectedCheckIn && selectedCheckOut) {
            const nights = Math.ceil((selectedCheckOut - selectedCheckIn) / (1000 * 60 * 60 * 24));
            const total = nights * basePrice;
            summaryTotal.textContent = `€${total}`;

            // Animate Price
            summaryTotal.style.transform = 'scale(1.1)';
            setTimeout(() => summaryTotal.style.transform = 'scale(1)', 200);
        } else {
            summaryTotal.textContent = '€0';
        }
    }

    // Input Listeners (Syncing Form -> Calendar)
    checkInInput?.addEventListener('change', (e) => {
        if (e.target.value) {
            selectedCheckIn = new Date(e.target.value);
            // Reset checkout if invalid
            if (selectedCheckOut && selectedCheckOut <= selectedCheckIn) selectedCheckOut = null;
            renderCalendar(currentDate);
        }
    });

    checkOutInput?.addEventListener('change', (e) => {
        if (e.target.value) {
            const date = new Date(e.target.value);
            if (selectedCheckIn && date > selectedCheckIn) {
                selectedCheckOut = date;
                renderCalendar(currentDate);
                updateUI();
            } else {
                alert("Check-out must be after check-in");
                e.target.value = '';
            }
        }
    });

    // Month Navigation
    prevBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextBtn?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    // Initial Render
    renderCalendar(currentDate);

    // ========================================
    // MODAL & BOOKING CONFIRMATION
    // ========================================
    const modal = document.getElementById('bookingModal');
    const closeModalList = [document.getElementById('closeModal'), document.getElementById('bookingModal')];
    const instantBookBtn = document.getElementById('instantBookBtn');
    const quickBookBtn = document.getElementById('quickBookBtn');

    const showModal = () => {
        if (!selectedCheckIn || !selectedCheckOut) {
            // Shake animation for attention if dates missing
            const bookingBar = document.querySelector('.booking-bar') || document.querySelector('.calendar-wrapper');
            bookingBar.style.transform = 'translateX(5px)';
            setTimeout(() => bookingBar.style.transform = 'none', 100);
            setTimeout(() => bookingBar.style.transform = 'translateX(-5px)', 200);
            setTimeout(() => bookingBar.style.transform = 'none', 300);
            return;
        }

        const nights = Math.ceil((selectedCheckOut - selectedCheckIn) / (1000 * 60 * 60 * 24));
        const total = nights * basePrice;

        const msg = document.getElementById('modalMessage');
        msg.innerHTML = `
            <strong>${nights} Nights</strong> defined by silence and comfort.<br>
            Total: €${total}<br><br>
            A confirmation email has been sent.
        `;

        modal.style.display = 'flex';
        // Fade in
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.5s ease';
            modal.style.opacity = '1';
        }, 10);
    };

    const hideModal = (e) => {
        if (e.target === modal || e.target.id === 'closeModal') {
            modal.style.opacity = '0';
            setTimeout(() => modal.style.display = 'none', 500);
        }
    };

    instantBookBtn?.addEventListener('click', showModal);
    quickBookBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        // If they click the arrow but haven't selected, scroll to calendar
        if (!selectedCheckIn) {
            document.querySelector('#booking').scrollIntoView({ behavior: 'smooth' });
        } else {
            showModal();
        }
    });

    closeModalList.forEach(el => el?.addEventListener('click', hideModal));

    console.log('🏔️ AlpineStay - Quiet Luxury Loaded');
});

