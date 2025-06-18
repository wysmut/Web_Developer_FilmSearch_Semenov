document.addEventListener('DOMContentLoaded', () => {
    // Переключение темы
    const themeToggle = document.querySelector('#themeToggle');
    const body = document.body;

    // Проверка сохраненной темы
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    }

    // Обработчик клика
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');

        // состояние темы
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // Поиск фильмов
    const searchBtn = document.getElementById('mainSearchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const searchInput = document.getElementById('mainSearchInput');
            const query = searchInput.value.trim();
            if (query) {
                // Исправленная ссылка на страницу поиска
                window.location.href = `Frontend/movie_list/index.html?q=${encodeURIComponent(query)}`;
            }
        });

        // Поиск при нажатии Enter
        const searchInput = document.getElementById('mainSearchInput');
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Навигация карусели
    const carouselArrow = document.querySelector('.carousel-arrow.right');
    if (carouselArrow) {
        carouselArrow.addEventListener('click', () => {
            const carousel = document.querySelector('.carousel-container');
            carousel.scrollBy({
                left: 400,
                behavior: 'smooth'
            });
        });
    }

    // Диагностика загрузки изображений
    console.log("Проверка загрузки изображений:");

    // Проверка фоновых изображений
    const checkImage = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    };

    const imageUrls = [
        'assets/images/hero-bg.jpg',
        'assets/images/search-bg.jpg',
        'assets/images/info-bg.jpg',
        'assets/images/movie1.jpg',
        'assets/images/movie2.jpg',
        'assets/images/movie3.jpg',
        'assets/icons/magnifying-glass.png'
    ];

    Promise.all(imageUrls.map(checkImage)).then(results => {
        console.log("Результаты загрузки изображений:");
        imageUrls.forEach((url, i) => {
            console.log(`${url}: ${results[i] ? 'Успешно' : 'Ошибка'}`);
            if (!results[i]) {
                console.error(`Не удалось загрузить: ${url}`);
            }
        });
    });
});