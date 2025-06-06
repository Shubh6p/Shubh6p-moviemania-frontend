// Get the movie title from URL query string
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');

// Load movie data from JSON
fetch('https://moviemania-backend-k8ot.onrender.com/api/movies')
  .then(res => {
    if (!res.ok) throw new Error('Network response was not ok');
    return res.json();
  })
  .then(movies => {
    const movie = movies.find(m => m.id === movieId);
    if (!movie) {
      document.body.innerHTML = `
        <div style="text-align:center; padding:2rem;">
          <h2>Movie not found</h2>
          <a href="index.html" style="color:blue;">Return to homepage</a>
        </div>`;
      return;
    }

    // Update page title
    document.title = `${movie.title} - MovieMania`;

    // Populate content
    document.getElementById('poster').src = movie.poster;
    document.getElementById('poster').alt = `${movie.title} Poster`;
    document.getElementById('title').textContent = movie.title;
    document.getElementById('release').textContent = movie.releaseDate;
    document.getElementById('summary').textContent = movie.summary;
    document.getElementById('rating').textContent = movie.rating;
    document.getElementById('languages').textContent = movie.languages;
    document.getElementById('countries').textContent = movie.countries;

    // Set download links
    const setLink = (id, quality) => {
      const link = document.getElementById(id);
      link.href = movie.downloads[quality];
      link.addEventListener('click', (e) => {
        if (!link.href || link.href === '#') {
          e.preventDefault();
          alert('Download link not available yet');
        }
      });
    };

    setLink('link480', '480p');
    setLink('link720', '720p');
    setLink('link1080', '1080p');

    // Inject trailer iframe
    if (movie.trailer) {
      const trailerDiv = document.getElementById('trailerEmbed');
      const trailerSrc = movie.trailer.includes("watch?v=")
        ? movie.trailer.replace("watch?v=", "embed/")
        : movie.trailer;
      trailerDiv.innerHTML = `<iframe width="100%" height="100%" src="${trailerSrc}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }
  })
  .catch(err => {
    console.error('Error loading movie data:', err);
    document.body.innerHTML = `
      <div style="text-align:center; padding:2rem;">
        <h2>Error loading movie data</h2>
        <p>${err.message}</p>
        <a href="index.html" style="color:blue;">Return to homepage</a>
      </div>`;
  });

// Add search functionality
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.innerHTML = '';
  }
});

fetch('https://moviemania-backend-k8ot.onrender.com/api/movies')
  .then(res => res.json())
  .then(movies => {
    const handleSearch = () => {
      const query = searchInput.value.toLowerCase().trim();
      searchResults.innerHTML = '';

      if (query.length === 0) return;

      let found = false;

      movies.forEach(movie => {
        const title = movie.title.toLowerCase();

        if (title.includes(query)) {
          const resultItem = document.createElement('div');
          resultItem.classList.add('result-item');
          resultItem.innerHTML = `
            <a href="movie.html?id=${movie.id}" class="result-link">
              <div class="result-poster">
                <img src="${movie.poster}" alt="${movie.title}">
              </div>
              <div class="result-details">
                <div class="movie-name">${movie.title}</div>
              </div>
            </a>
          `;
          searchResults.appendChild(resultItem);
          found = true;
        }
      });

      if (!found) {
        searchResults.innerHTML = '<p class="no-results">No results found. Please check the name again.</p>';
      }
    };

    searchInput.addEventListener('input', debounce(handleSearch, 300));
  })
  .catch(err => {
    console.error('Error loading movie data:', err);
    searchResults.innerHTML = '<p class="no-results">Failed to load movie data. Try again later.</p>';
  });