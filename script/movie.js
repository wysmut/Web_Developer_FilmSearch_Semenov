// Обработчик смены темы
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');

    // Проверяем сохраненную тему
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.classList.add('active');
    }

    // Обработчик клика по переключателю темы
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        themeToggle.classList.toggle('active');

        // Сохраняем состояние темы
        localStorage.setItem('theme',
            document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });

    // Загрузка данных о фильме
    loadMovieData();
});

// Функция загрузки данных о фильме
async function loadMovieData() {
    // Получаем ID из URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        showError('ID фильма не указан в URL');
        return;
    }

    try {
        // Запрос к API
        const API_KEY = '81X15P0-HG3495J-H0MARKT-HH5DMCZ';
        const response = await fetch(`https://api.kinopoisk.dev/v1.4/movie/${movieId}`, {
            headers: {
                'X-API-KEY': API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
        }

        const movieData = await response.json();

        // Проверка наличия основных данных
        if (!movieData || !movieData.id) {
            throw new Error('Данные о фильме не получены');
        }

        // Заполняем страницу данными
        populateMovieData(movieData);

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showError(`Произошла ошибка: ${error.message}`);
    }
}

// Функция заполнения страницы данными
function populateMovieData(data) {
    try {
        // 1. Постер и название
        document.getElementById('movieTitle').textContent =
            data.name || data.alternativeName || data.enName || 'Название не указано';

        // Постер фильма
        const posterUrl = data.poster?.url;
        const posterElement = document.getElementById('moviePoster');
        if (posterUrl) {
            posterElement.src = posterUrl;
            posterElement.onerror = function() {
                this.src = '../assets/images/poster-placeholder.jpg';
            };
        } else {
            posterElement.src = '../assets/images/poster-placeholder.jpg';
        }

        // 2. Блок "О фильме"
        // Жанры
        const genres = data.genres?.length
            ? data.genres.map(g => g.name).join(', ')
            : 'Не указано';
        document.getElementById('movieGenres').textContent = genres;

        // Страны
        const countries = data.countries?.length
            ? data.countries.map(c => c.name).join(', ')
            : 'Не указано';
        document.getElementById('movieCountries').textContent = countries;

        // Режиссеры
        const directors = [];
        if (data.persons) {
            for (const person of data.persons) {
                if (person.enProfession === 'director' || person.profession === 'режиссеры') {
                    directors.push(person.name || person.enName);
                }
            }
        }
        document.getElementById('movieDirectors').textContent =
            directors.join(', ') || 'Не указано';

        // Дата релиза
        let releaseDate = 'Не указано';
        if (data.premiere?.world) {
            releaseDate = new Date(data.premiere.world).toLocaleDateString('ru-RU');
        } else if (data.year) {
            releaseDate = `${data.year}`;
        } else if (data.releaseYears?.[0]?.start) {
            releaseDate = data.releaseYears[0].start;
        }
        document.getElementById('movieReleaseDate').textContent = releaseDate;

        // Возрастные ограничения
        const ageRating = data.ageRating ? `${data.ageRating}+` : 'Не указано';
        document.getElementById('movieAgeRating').textContent = ageRating;

        // 3. Трейлер
        const trailerContainer = document.getElementById('trailerContainer');
        trailerContainer.innerHTML = ''; // Очищаем контейнер

        if (data.videos?.trailers && data.videos.trailers.length > 0) {
            // Ищем YouTube трейлер
            const youtubeTrailer = data.videos.trailers.find(t => t.site === 'youtube');
            if (youtubeTrailer) {
                const trailerId = extractYouTubeId(youtubeTrailer.url);
                if (trailerId) {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${trailerId}`;
                    iframe.classList.add('trailer-iframe');
                    iframe.allowFullscreen = true;
                    iframe.title = "Трейлер фильма";
                    trailerContainer.appendChild(iframe);
                } else {
                    trailerContainer.innerHTML = '<div class="trailer-placeholder">Трейлер недоступен</div>';
                }
            } else {
                // Если нет YouTube, берем первый доступный
                const firstTrailer = data.videos.trailers[0];
                if (firstTrailer.url) {
                    const video = document.createElement('video');
                    video.src = firstTrailer.url;
                    video.controls = true;
                    video.classList.add('trailer-iframe');
                    trailerContainer.appendChild(video);
                } else {
                    trailerContainer.innerHTML = '<div class="trailer-placeholder">Трейлер не найден</div>';
                }
            }
        } else {
            trailerContainer.innerHTML = '<div class="trailer-placeholder">Трейлеры отсутствуют</div>';
        }

        // 4. Галерея
        const galleryImage1 = document.getElementById('galleryImage1');
        const galleryImage2 = document.getElementById('galleryImage2');

        // Первое изображение - постер
        setImageWithFallback(galleryImage1, posterUrl, '../assets/images/poster-placeholder.jpg');

        // Второе изображение - фоновое или кадр из фильма
        if (data.backdrop?.url) {
            setImageWithFallback(galleryImage2, data.backdrop.url, '../assets/images/poster-placeholder.jpg');
        } else if (data.frames?.length > 0) {
            setImageWithFallback(galleryImage2, data.frames[0].preview, '../assets/images/poster-placeholder.jpg');
        } else {
            setImageWithFallback(galleryImage2, posterUrl, '../assets/images/poster-placeholder.jpg');
        }

        // 5. Рецензии
        const reviewsContainer = document.getElementById('reviewsContainer');
        reviewsContainer.innerHTML = '';

        if (data.reviews?.docs?.length > 0) {
            // Берем первые 2 рецензии
            const reviewsToShow = data.reviews.docs.slice(0, 2);

            reviewsToShow.forEach(review => {
                const reviewCard = document.createElement('div');
                reviewCard.className = 'review-card';
                reviewCard.innerHTML = `
                    <div class="review-header">
                        <div class="review-author">${review.author || 'Анонимный автор'}</div>
                        <div class="review-rating">
                            <span>★</span>
                            <span>${review.rating || '0.0'}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        ${review.review || 'Рецензия отсутствует'}
                    </div>
                `;
                reviewsContainer.appendChild(reviewCard);
            });

            // Если только одна рецензия, добавляем сообщение
            if (data.reviews.docs.length === 1) {
                const messageCard = document.createElement('div');
                messageCard.className = 'review-card';
                messageCard.innerHTML = `
                    <div class="no-reviews">
                        <p>Вторая рецензия отсутствует</p>
                    </div>
                `;
                reviewsContainer.appendChild(messageCard);
            }
        } else {
            reviewsContainer.innerHTML = `
                <div class="no-reviews">
                    <p>Рецензии к данному фильму отсутствуют</p>
                </div>
            `;
        }

        // Обновляем title страницы
        document.title = `${data.name || 'Фильм'} | КиноПоиск`;

    } catch (error) {
        console.error('Ошибка при обработке данных:', error);
        showError('Ошибка при отображении данных фильма');
    }
}

// Утилиты
function setImageWithFallback(element, url, fallback) {
    if (url) {
        element.src = url;
        element.onerror = function() {
            this.src = fallback;
        };
    } else {
        element.src = fallback;
    }
}

// Извлечение ID из YouTube URL
function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Показать сообщение об ошибке
function showError(message) {
    const mainContent = document.querySelector('.movie-detail-container');
    mainContent.innerHTML = `
        <div class="error-message">
            <h2>Ошибка загрузки</h2>
            <p>${message}</p>
            <button onclick="location.reload()">Попробовать снова</button>
        </div>
    `;
    // Стили для сообщения об ошибке
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            text-align: center;
            padding: 50px;
            background: var(--bg-light);
            border-radius: 20px;
            margin-top: 50px;
        }
        body.dark-theme .error-message {
            background: var(--header-bg-dark);
        }
        .error-message h2 {
            color: #e74c3c;
            margin-bottom: 20px;
        }
        .error-message p {
            margin-bottom: 20px;
            font-size: 18px;
        }
        .error-message button {
            margin-top: 20px;
            padding: 10px 20px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        .error-message button:hover {
            background: #d84315;
        }
    `;
    document.head.appendChild(style);
}