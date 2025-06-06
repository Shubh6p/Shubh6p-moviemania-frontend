// Unified script.js for all pages (search now scans all movies globally + multi-category support)

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const moviesContainer = document.getElementById('moviesContainer');
const paginationContainer = document.getElementById('pagination');
const categoryButtons = document.querySelectorAll('.category-btn');

const itemsPerPage = 10;
const maxVisiblePages = 6;
let currentPage = 1;
let allMovies = [];
let filteredMovies = [];

const isIndex = !!moviesContainer;
const isMoviePage = window.location.pathname.includes('movie.html');

if (isIndex) {
  fetch('backend/movies.json')
    .then(response => response.json())
    .then(data => {
      allMovies = data;
      const urlParams = new URLSearchParams(window.location.search);
      const initialCategory = urlParams.get('category');
      const filterParam = urlParams.get('filter'); // ✅ added filter support

      filteredMovies = allMovies.filter(movie => {
        const categories = Array.isArray(movie.category)
          ? movie.category.map(c => c.toLowerCase())
          : [movie.category?.toLowerCase()];

        const matchCategory = initialCategory ? categories.includes(initialCategory.toLowerCase()) : true;
        const matchFilter = filterParam ? categories.includes(filterParam.toLowerCase()) : true;

        return matchCategory && matchFilter;
      });

      displayMovies(filteredMovies);
      generatePagination(filteredMovies.length, itemsPerPage);
    })
    .catch(error => console.error('Error loading movies JSON:', error));

  categoryButtons.forEach(button => {
    button.addEventListener('click', e => {
      e.preventDefault();
      const category = button.getAttribute('data-category');
      filteredMovies = category === 'all'
        ? allMovies
        : allMovies.filter(movie => {
            if (Array.isArray(movie.category)) {
              return movie.category.includes(category);
            } else {
              return movie.category === category;
            }
          });
      currentPage = 1;
      displayMovies(filteredMovies);
      generatePagination(filteredMovies.length, itemsPerPage);
      scrollToTop();
    });
  });

  function displayMovies(movies) {
    moviesContainer.innerHTML = '';
    movies.forEach(movie => {
      const movieLink = document.createElement('a');
      movieLink.href = movie.url;
      movieLink.innerHTML = `
        <div class="movie-card" data-title="${movie.title}" data-details="${movie.details}">
          <img src="${movie.image}" alt="${movie.title}">
          <h3>${movie.title}</h3>
          <p>${movie.details}</p>
        </div>
      `;
      moviesContainer.appendChild(movieLink);
    });
    displayPage(currentPage, itemsPerPage);
  }

  function generatePagination(totalItems, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    let startPage = 1;
    let endPage = totalPages;
    if (totalPages > maxVisiblePages) {
      if (currentPage <= maxVisiblePages) {
        endPage = maxVisiblePages;
      } else if (currentPage > totalPages - maxVisiblePages + 1) {
        startPage = totalPages - maxVisiblePages + 1;
      } else {
        startPage = currentPage - Math.floor(maxVisiblePages / 2);
        endPage = currentPage + Math.floor(maxVisiblePages / 2);
      }
    }

    const prevBtn = document.createElement('a');
    prevBtn.href = '#';
    prevBtn.textContent = 'Prev';
    prevBtn.classList.add('prev-button');
    if (currentPage === 1) {
      prevBtn.classList.add('disabled');
      prevBtn.style.pointerEvents = 'none';
    }
    paginationContainer.appendChild(prevBtn);
    prevBtn.addEventListener('click', e => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage, itemsPerPage);
        generatePagination(filteredMovies.length, itemsPerPage);
        scrollToTop();
      }
    });

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = document.createElement('a');
      pageButton.href = '#';
      pageButton.textContent = i;
      pageButton.classList.add('page-number');
      if (i === currentPage) pageButton.classList.add('active');
      paginationContainer.appendChild(pageButton);
      pageButton.addEventListener('click', e => {
        e.preventDefault();
        if (i !== currentPage) {
          currentPage = i;
          displayPage(currentPage, itemsPerPage);
          generatePagination(filteredMovies.length, itemsPerPage);
          scrollToTop();
        }
      });
    }

    const nextBtn = document.createElement('a');
    nextBtn.href = '#';
    nextBtn.textContent = 'Next';
    nextBtn.classList.add('next-button');
    if (currentPage === totalPages) {
      nextBtn.classList.add('disabled');
      nextBtn.style.pointerEvents = 'none';
    }
    paginationContainer.appendChild(nextBtn);
    nextBtn.addEventListener('click', e => {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        displayPage(currentPage, itemsPerPage);
        generatePagination(filteredMovies.length, itemsPerPage);
        scrollToTop();
      }
    });
  }

  function displayPage(page, itemsPerPage) {
    const start = (page - 1) * itemsPerPage;
    const end = page * itemsPerPage;
    const items = Array.from(moviesContainer.children);
    items.forEach((item, index) => {
      item.style.display = index >= start && index < end ? 'block' : 'none';
    });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

if (isMoviePage) {
  const movieId = new URLSearchParams(window.location.search).get('id');
  fetch('movie.json')
    .then(res => res.json())
    .then(movies => {
      const movie = movies.find(m => m.id === movieId);
      if (!movie) {
        document.body.innerHTML = '<h2 style="text-align:center; padding: 2rem; color: white;">Movie not found</h2>';
        return;
      }
      document.title = `${movie.title} - MovieMania`;
      document.getElementById('title').textContent = movie.title;
      document.getElementById('poster').src = movie.poster;
      document.getElementById('poster').alt = `${movie.title} Poster`;
      document.getElementById('release').textContent = movie.releaseDate;
      document.getElementById('stars').textContent = movie.stars;
      document.getElementById('rating').textContent = movie.rating;
      document.getElementById('languages').textContent = movie.languages;
      document.getElementById('countries').textContent = movie.countries;
      document.getElementById('summary').textContent = movie.summary;
      document.getElementById('link480').href = movie.downloads['480p'];
      document.getElementById('link720').href = movie.downloads['720p'];
      document.getElementById('link1080').href = movie.downloads['1080p'];
    })
    .catch(err => {
      console.error('Error loading movie.json:', err);
      document.body.innerHTML = '<h2 style="text-align:center; padding: 2rem; color: white;">Error loading movie data</h2>';
    });
}

// Global Search (Searches entire movies.json on all pages)
if (searchInput && searchResults) {
  let allSearchableMovies = [];
  fetch('backend/movies.json')
    .then(response => response.json())
    .then(data => {
      allSearchableMovies = data;
    })
    .catch(err => {
      console.error('Error loading movie data for search:', err);
    });

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = '';
    if (query.length === 0) return;

    const matching = allSearchableMovies.filter(movie =>
      movie.title.toLowerCase().includes(query) ||
      (movie.details && movie.details.toLowerCase().includes(query))
    );

    if (matching.length === 0) {
      searchResults.innerHTML = '<p class="no-results">No results found. Please check the name again. You can <a href="contact.html" style="color: #00f; text-decoration: underline;">contact us</a> for this movie if you cant find here</p>';
      return;
    }

    matching.forEach(movie => {
      const resultItem = document.createElement('div');
      resultItem.classList.add('result-item');
      resultItem.innerHTML = `
        <a href="${movie.url}" class="result-link">
          <div class="result-poster">
            <img src="${movie.image}" alt="${movie.title}">
          </div>
          <div class="result-details">
            <strong>${movie.title}</strong>
            <p>${movie.details || ''}</p>
          </div>
        </a>
      `;
      searchResults.appendChild(resultItem);
    });
  });

  searchResults.addEventListener('click', (e) => {
    const target = e.target.closest('.result-link');
    if (target) {
      window.location.href = target.getAttribute('href');
    }
  });

  // ===== New feature: Hide search results when clicking outside search area =====
  document.addEventListener('click', function (event) {
    const isClickInsideSearch = searchInput.contains(event.target) || searchResults.contains(event.target);

    if (!isClickInsideSearch) {
      searchResults.innerHTML = '';
    }
  });
}

// Enable dropdowns to toggle on click for mobile, and hover for desktop
document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.dropdown');

  const isMobile = () => window.innerWidth <= 768;

  dropdowns.forEach(dropdown => {
    const link = dropdown.querySelector('a');
    link.addEventListener('click', (e) => {
      if (isMobile()) {
        e.preventDefault(); // prevent navigation
        dropdown.classList.toggle('active');
      }
    });
  });

  // Close dropdowns if clicked outside (optional but recommended)
  document.addEventListener('click', (e) => {
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });
});
