// API конфигурация
const API_KEY = '81X15P0-HG3495J-H0MARKT-HH5DMCZ';
const BASE_URL = 'https://api.kinopoisk.dev/v1.4/movie';

// DOM элементы
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const moviesGrid = document.getElementById('moviesGrid');
const pagination = document.getElementById('pagination');
const filterDropdowns = document.querySelectorAll('.filter-dropdown');
const resultsCount = document.getElementById('resultsCount');

let currentFilters = {
    country: [],
    year: [],
    rating: [],
    genre: []
};
let currentPage = 1;
let totalPages = 1;
let totalMovies = 0;
const moviesPerPage = 9;
const requestLimit = 30;

// Переключение темы
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Проверка сохранённой темы при загрузке
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
} else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-theme');
}

// Открытие/закрытие выпадающих фильтров
filterDropdowns.forEach(dropdown => {
    const header = dropdown.querySelector('.filter-header');
    header.addEventListener('click', () => {
        dropdown.classList.toggle('active');

        const chevron = header.querySelector('.filter-chevron');
        if (dropdown.classList.contains('active')) {
            chevron.style.transform = 'rotate(180deg)';
        } else {
            chevron.style.transform = 'rotate(0deg)';
        }
    });
});

// Функция для получения популярных фильмов
async function getPopularMovies(page = 1) {
    try {
        moviesGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

        const response = await fetch(
            `${BASE_URL}?page=${page}&limit=${requestLimit}&sortField=rating.kp&sortType=-1`,
            {
                headers: { 'X-API-KEY': API_KEY }
            }
        );

        const data = await response.json();
        totalMovies = data.total;
        resultsCount.textContent = `Найдено фильмов: ${totalMovies}`;
        totalPages = Math.ceil(totalMovies / moviesPerPage);

        return filterMoviesWithRequiredData(data.docs);
    } catch (error) {
        console.error('Ошибка при получении фильмов:', error);
        moviesGrid.innerHTML = '<div class="no-results">Ошибка загрузки данных. Пожалуйста, попробуйте позже.</div>';
        return [];
    }
}

// Фильтрация фильмов с обязательными данными
function filterMoviesWithRequiredData(movies) {
    const filtered = movies.filter(movie => (
        movie.name &&
        movie.poster?.url &&
        movie.rating?.kp !== undefined
    ));
    return filtered.slice(0, moviesPerPage);
}

// Функция для поиска фильмов
async function searchMovies(query, filters = {}, page = 1) {
    try {
        const params = new URLSearchParams({
            page,
            limit: requestLimit,
            ...filters
        });

        if (query) {
            params.set('name', query);
        }

        const response = await fetch(`${BASE_URL}?${params.toString()}`, {
            headers: { 'X-API-KEY': API_KEY }
        });

        const data = await response.json();
        totalMovies = data.total;
        resultsCount.textContent = `Найдено фильмов: ${totalMovies}`;
        totalPages = Math.ceil(totalMovies / moviesPerPage);

        return filterMoviesWithRequiredData(data.docs);
    } catch (error) {
        console.error('Ошибка при поиске фильмов:', error);
        moviesGrid.innerHTML = '<div class="no-results">Ошибка загрузки данных. Пожалуйста, попробуйте позже.</div>';
        return [];
    }
}

// Функция для отображения фильмов
function displayMovies(movies) {
    moviesGrid.innerHTML = '';

    if (movies.length === 0) {
        moviesGrid.innerHTML = '<div class="no-results">Фильмы не найдены. Попробуйте изменить критерии поиска.</div>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        // Форматирование рейтинга
        const rating = movie.rating?.kp ? movie.rating.kp.toFixed(1) : '0.0';

        movieCard.innerHTML = `
            <div class="movie-poster-container">
                <img src="${movie.poster?.url || 'https://via.placeholder.com/300x450?text=No+Image'}"
                     alt="${movie.name}"
                     class="movie-poster">
            </div>
            <div class="movie-info-container">
                <h3 class="movie-title">${movie.name}</h3>
                <div class="movie-rating-container">
                    <span class="movie-rating">
                        <i class="fas fa-star"></i>${rating}
                    </span>
                </div>
            </div>
        `;

        // Обработчик перехода на страницу фильма
        movieCard.addEventListener('click', () => {
            window.location.href = `Frontend/movie/index.html?id=${movie.id}`;
        });

        moviesGrid.appendChild(movieCard);
    });
}

// Функция для отображения пагинации
function displayPagination() {
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadMovies();
        }
    });
    pagination.appendChild(prevBtn);

    // Номера страниц
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            loadMovies();
        });
        pagination.appendChild(pageBtn);
    }

    // Следующая страница
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadMovies();
        }
    });
    pagination.appendChild(nextBtn);
}

// Функция для сбора фильтров
function gatherFilters() {
    const filters = {
        country: [],
        year: [],
        rating: [],
        genre: []
    };

    document.querySelectorAll('input[name="country"]:checked').forEach(checkbox => {
        filters.country.push(checkbox.value);
    });

    document.querySelectorAll('input[name="year"]:checked').forEach(checkbox => {
        filters.year.push(checkbox.value);
    });

    document.querySelectorAll('input[name="rating"]:checked').forEach(checkbox => {
        filters.rating.push(checkbox.value);
    });

    document.querySelectorAll('input[name="genre"]:checked').forEach(checkbox => {
        filters.genre.push(checkbox.value);
    });

    return filters;
}

// Преобразование фильтров в параметры API
function formatFiltersForAPI(filters) {
    const apiParams = {};

    if (filters.country.length > 0) {
        apiParams['countries.name'] = filters.country.join('&countries.name=');
    }

    if (filters.genre.length > 0) {
        apiParams['genres.name'] = filters.genre.join('&genres.name=');
    }

    if (filters.year.length > 0) {
        apiParams.year = filters.year.join(',');
    }

    if (filters.rating.length > 0) {
        apiParams['rating.kp'] = filters.rating.join(',');
    }

    return apiParams;
}

// Основная функция загрузки фильмов
async function loadMovies() {
    const query = searchInput.value.trim();
    const filters = gatherFilters();
    const apiFilters = formatFiltersForAPI(filters);

    let movies = [];

    if (query || Object.keys(apiFilters).length > 0) {
        movies = await searchMovies(query, apiFilters, currentPage);
    } else {
        movies = await getPopularMovies(currentPage);
    }

    displayMovies(movies);
    displayPagination();
}

// Обработчик поиска
async function handleSearch() {
    currentPage = 1;
    await loadMovies();
}

// Инициализация страницы
async function init() {
    // Извлечение параметра поиска из URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    if (searchQuery) {
        searchInput.value = decodeURIComponent(searchQuery);
    }

    await loadMovies();

    // Слушатели событий
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    applyFiltersBtn.addEventListener('click', handleSearch);

    resetFiltersBtn.addEventListener('click', () => {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        searchInput.value = '';
        filterDropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.querySelector('.filter-chevron').style.transform = 'rotate(0deg)';
        });
        currentPage = 1;
        loadMovies();
    });
}

document.addEventListener('DOMContentLoaded', init);