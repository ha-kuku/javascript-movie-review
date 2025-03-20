(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const Header = ({ movie }) => {
  const header = document.createElement("header");
  const backgroundImageUrl = movie && movie.posterPath ? `https://image.tmdb.org/t/p/original${movie.posterPath}` : "images/default-background.jpg";
  header.innerHTML = `
  <div class="background-container" style="background-image: url('${backgroundImageUrl}');">
    <div class="overlay" aria-hidden="true"></div>
    <div class="top-rated-container">
      
      <div class="top-rated-movie">
        <div class="rate">
          <img src="images/star_empty.png" class="star" />
          <span class="rate-value">${movie == null ? void 0 : movie.voteAverage}</span>
        </div>
        <div class="title">${movie == null ? void 0 : movie.title}</div>
        <button class="primary detail">자세히 보기</button>
      </div>
    </div>
  </div>
`;
  return header;
};
const NavigationBar = ({ input }) => {
  const navigationContainer = document.createElement("div");
  navigationContainer.classList.add("navigation-container");
  navigationContainer.innerHTML = `
        <h1 class="logo">
          <img src="images/logo.png" alt="MovieList" />
        </h1>
      `;
  navigationContainer.appendChild(input);
  return navigationContainer;
};
const MovieItem = ({ title, voteAverage, posterPath }) => {
  const movieItem = document.createElement("li");
  const mappedImage = posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "images/nullImage.png";
  movieItem.innerHTML = `
    <div class="item">
      <img class="thumbnail" src="${mappedImage}" alt="${title}" />
      <div class="item-desc">
        <p class="rate">
          <img src="images/star_empty.png" class="star" /><span>${voteAverage}</span>
        </p>
        <strong>${title}</strong>
      </div>
    </div>
  `;
  return movieItem;
};
const MovieList = ({ movieItems = [] }) => {
  const movieContainer = document.createElement("section");
  movieContainer.classList.add("movie-container");
  if (movieItems === null) {
    return;
  }
  if (movieItems.length !== 0) {
    const ul = document.createElement("ul");
    ul.classList.add("thumbnail-list");
    movieItems.forEach((movie) => {
      const movieItemElement = MovieItem({
        title: movie.title,
        voteAverage: movie.voteAverage,
        posterPath: movie.posterPath
      });
      ul.appendChild(movieItemElement);
    });
    movieContainer.appendChild(ul);
  }
  if (movieItems.length === 0) {
    movieContainer.innerHTML = `
       <div class="empty-container">
        <img src="images/empty_logo.png" alt="우아한테크코스 로고" />
        <h2 class="empty-content">검색 결과가 없습니다.</h2>
      </div>
  `;
  }
  return movieContainer;
};
const Input = ({ type, placeholder, onSearch }) => {
  const searchWrapper = document.createElement("div");
  searchWrapper.classList.add("search-wrapper");
  searchWrapper.innerHTML = `
      <input type="${type}" class="search-input" placeholder="${placeholder}" />
      <img src="images/Search.png" class="search-icon" alt="검색" />
    `;
  const searchInput = searchWrapper.querySelector(
    ".search-input"
  );
  const searchIcon = searchWrapper.querySelector(".search-icon");
  const handleSearch = () => {
    const query = searchInput.value.trim();
    if (query !== "") {
      onSearch(query);
    }
  };
  searchIcon == null ? void 0 : searchIcon.addEventListener("click", handleSearch);
  searchInput == null ? void 0 : searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });
  return searchWrapper;
};
const Button = ({ text, onClick }) => {
  const detailButton = document.createElement("button");
  detailButton.classList.add("detail-button", "primary");
  detailButton.textContent = text;
  detailButton.addEventListener("click", onClick);
  return detailButton;
};
const popularApiUrl = "https://api.themoviedb.org/3/movie/popular?language=ko-KR&region=ko-KR";
const searchApiUrl = "https://api.themoviedb.org/3/search/movie?";
const bearerToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMzA1NThjYzVlYzFhM2Y0M2FlM2E3NjdmMTQwNjk2YiIsIm5iZiI6MTc0MjM0OTI5My4yNTgsInN1YiI6IjY3ZGEyM2VkYjA1YzhhMzgwZmExZTRjZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ViB4PNJW0iubI1UUQbvPIxXAWtyxauQT2GluGNB_7dM";
const defaultOptions = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${bearerToken}`
  }
};
const fetchMovies = (apiUrl = popularApiUrl) => {
  return fetch(apiUrl, defaultOptions).then((res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }).catch((error) => {
    console.error("Error fetching movies:", error);
    alert("영화 정보를 가져오는 중 오류가 발생했습니다.");
    throw error;
  });
};
const mapToMovie = (apiData) => ({
  id: apiData.id,
  title: apiData.title,
  voteAverage: apiData.vote_average,
  posterPath: apiData.poster_path
});
const moviesPopularState = {
  list: [],
  currentPage: 1,
  totalPages: 0
};
const moviesSearchedState = {
  list: [],
  currentPage: 1,
  totalPages: 0
};
const isLastPage = (movieType) => {
  if (movieType === "popular") {
    return moviesPopularState.currentPage === moviesPopularState.totalPages;
  }
  if (movieType === "search") {
    return moviesSearchedState.currentPage === moviesSearchedState.totalPages;
  }
  return false;
};
const fetchPopularMovies = async (page = 1) => {
  try {
    const data = await fetchMovies(`${popularApiUrl}&page=${page}`);
    moviesPopularState.list = data.results.map((item) => mapToMovie(item));
    moviesPopularState.currentPage = page;
    moviesPopularState.totalPages = data.total_pages;
    return moviesPopularState.list;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
};
const fetchSearchedMovies = async (searchQuery, page = 1) => {
  try {
    const url = `${searchApiUrl}query=${encodeURIComponent(
      searchQuery
    )}&page=${page}&language=ko-KR&region=ko-KR&include_adult=false`;
    const data = await fetchMovies(url);
    moviesSearchedState.list = data.results.map(
      (item) => mapToMovie(item)
    );
    moviesSearchedState.currentPage = page;
    moviesSearchedState.totalPages = data.total_pages;
    return moviesSearchedState.list;
  } catch (error) {
    console.error("Error fetching searched movies:", error);
    alert("영화 정보를 가져오는 중 오류가 발생했습니다.");
    throw error;
  }
};
document.addEventListener("DOMContentLoaded", async () => {
  const main = document.querySelector("main");
  if (!main) return;
  const title = document.querySelector("h2");
  if (!title) return;
  const wrap = document.querySelector("#wrap");
  if (!wrap) return;
  const header = Header({ movie: null });
  wrap == null ? void 0 : wrap.prepend(header);
  title.classList.add("main-title");
  title.textContent = "지금 인기 있는 영화";
  const movieState = {
    mode: "popular",
    query: ""
  };
  const input = Input({
    type: "text",
    placeholder: "검색어를 입력하세요",
    onSearch: async (query) => {
      try {
        if (header.parentElement) {
          header.remove();
        }
        movieState.mode = "search";
        movieState.query = query;
        const searchedMovies = await fetchSearchedMovies(query);
        main.innerHTML = "";
        const movieListComponent = MovieList({
          movieItems: searchedMovies
        });
        title.textContent = `"${query}" 검색 결과`;
        main.appendChild(movieListComponent);
      } catch (error) {
        console.error("검색 영화 호출 중 오류 발생:", error);
        alert("검색 중 오류가 발생했습니다.");
      }
    }
  });
  const navigationBar = NavigationBar({ input });
  wrap == null ? void 0 : wrap.prepend(navigationBar);
  const renderMovies = () => {
    const movieItems = movieState.mode === "popular" ? moviesPopularState.list : moviesSearchedState.list;
    const movieListComponent = MovieList({ movieItems });
    main.appendChild(movieListComponent);
  };
  try {
    await fetchPopularMovies();
    if (moviesPopularState.list.length > 0) {
      const updatedHeader = Header({
        movie: moviesPopularState.list[0]
      });
      header.replaceWith(updatedHeader);
    }
    renderMovies();
  } catch (error) {
    console.error("Error in main.ts:", error);
    alert("영화 정보를 가져오는 중 오류가 발생했습니다.");
  }
  const container = document.querySelector(".container");
  if (!container) return;
  const moreButton = Button({
    text: "더 보기",
    onClick: async () => {
      if (movieState.mode === "popular") {
        if (isLastPage("popular")) {
          moreButton.style.display = "none";
          alert("마지막 페이지입니다.");
          return;
        }
        await fetchPopularMovies(moviesPopularState.currentPage + 1);
        renderMovies();
      } else if (movieState.mode === "search") {
        if (isLastPage("search")) {
          moreButton.style.display = "none";
          alert("마지막 페이지입니다.");
          return;
        }
        await fetchSearchedMovies(
          movieState.query,
          moviesSearchedState.currentPage + 1
        );
        renderMovies();
      }
    }
  });
  container == null ? void 0 : container.appendChild(moreButton);
});
