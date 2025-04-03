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
  console.log(apiUrl);
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
  posterPath: apiData.poster_path,
  genres: apiData.genres,
  overview: apiData.overview
});
const popularMovieList = {
  list: [],
  currentPage: 1,
  totalPages: 0
};
const searchedMovieList = {
  list: [],
  currentPage: 0,
  totalPages: 0
};
const isLastPage = (movieType) => {
  if (movieType === "popular") {
    return popularMovieList.currentPage === popularMovieList.totalPages;
  }
  if (movieType === "search") {
    return searchedMovieList.currentPage === searchedMovieList.totalPages;
  }
  return false;
};
const fetchPopularMovies = async (page = 1) => {
  try {
    const data = await fetchMovies(`${popularApiUrl}&page=${page}`);
    popularMovieList.list = [
      ...popularMovieList.list,
      ...data.results.map((item) => mapToMovie(item))
    ];
    popularMovieList.currentPage = page;
    popularMovieList.totalPages = data.total_pages;
    return popularMovieList.list;
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
    if (page === searchedMovieList.currentPage) return searchedMovieList.list;
    searchedMovieList.list = [
      ...searchedMovieList.list,
      ...data.results.map((item) => mapToMovie(item))
    ];
    searchedMovieList.currentPage = page;
    searchedMovieList.totalPages = data.total_pages;
    return searchedMovieList.list;
  } catch (error) {
    console.error("Error fetching searched movies:", error);
    alert("영화 정보를 가져오는 중 오류가 발생했습니다.");
    throw error;
  }
};
const fetchDetailMovie = async (movie_id) => {
  const url = `https://api.themoviedb.org/3/movie/${movie_id}?language=ko-KR`;
  console.log(url);
  const data = await fetchMovies(url);
  return data;
};
const movieState = {
  mode: "popular",
  query: ""
};
const MostPopularMovieBanner = () => {
  const header = document.createElement("header");
  const renderMostPopularMovieBanner = () => {
    const movie = popularMovieList.list[0];
    const backgroundImageUrl = movie && movie.posterPath ? `https://image.tmdb.org/t/p/original${movie.posterPath}` : "images/default-background.jpg";
    header.innerHTML = `
  <div class="background-container" style="background-image: url('${backgroundImageUrl}');">
    <div class="overlay" aria-hidden="true"></div>
    <div class="top-rated-container">
      
      <div class="top-rated-movie">
        <div class="rate">
          <img src="images/star_empty.png" class="star" />
          <span class="rate-value">${movie == null ? void 0 : movie.voteAverage.toFixed(1)}</span>
        </div>
        <div class="title">${movie == null ? void 0 : movie.title}</div>
        <button class="primary detail">자세히 보기</button>
      </div>
    </div>
  </div>
`;
  };
  renderMostPopularMovieBanner();
  return { mostPopularMovieBanner: header, renderMostPopularMovieBanner };
};
const NavigationBar = ({
  searchWrap,
  routeToPopularPage
}) => {
  const navigationContainer = document.createElement("div");
  navigationContainer.classList.add("navigation-container");
  const logo = document.createElement("h1");
  logo.classList.add("logo");
  logo.innerHTML = `<img src="images/logo.png" alt="MovieList" />`;
  logo.addEventListener("click", routeToPopularPage);
  navigationContainer.append(logo, searchWrap);
  return navigationContainer;
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
  const handleSearch2 = () => {
    const query = searchInput.value.trim();
    if (query !== "") {
      onSearch(query);
    }
  };
  const handleEnterKey = (event, callback) => {
    if (event.key === "Enter") {
      callback();
    }
  };
  const handleKeyDown = (event) => handleEnterKey(event, handleSearch2);
  searchIcon == null ? void 0 : searchIcon.addEventListener("click", handleSearch2);
  searchInput == null ? void 0 : searchInput.addEventListener("keydown", handleKeyDown);
  return searchWrapper;
};
const getLocalStorage = (key, defaultValue) => {
  const localStorageItem = localStorage.getItem(key);
  if (localStorageItem === null) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(localStorageItem);
};
const setLocalStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
const STAR_RATE_STORAGE_ID = "starRateStorageId";
const setMovieStarRate = (id, starRate) => {
  const starRateStorage = getLocalStorage(
    STAR_RATE_STORAGE_ID,
    {}
  );
  setLocalStorage(STAR_RATE_STORAGE_ID, {
    ...starRateStorage,
    [id]: starRate
  });
};
const getStarRateByMovieId = (id) => {
  if (JSON.parse(localStorage.getItem(STAR_RATE_STORAGE_ID) ?? "{}")[id] === void 0) {
    setMovieStarRate(id, 0);
  }
  const starRateStorage = getLocalStorage(
    STAR_RATE_STORAGE_ID,
    {}
  );
  return starRateStorage[String(id)];
};
const StarRateMessage = {
  MESSAGE_OF_STAR_RATE_2: "최악이예요",
  MESSAGE_OF_STAR_RATE_4: "별로예요",
  MESSAGE_OF_STAR_RATE_6: "보통이에요",
  MESSAGE_OF_STAR_RATE_8: "재미있어요",
  MESSAGE_OF_STAR_RATE_10: "명작이에요"
};
const getStarRateMessage = (starRate) => {
  switch (starRate) {
    case 2:
      return StarRateMessage["MESSAGE_OF_STAR_RATE_2"];
    case 4:
      return StarRateMessage["MESSAGE_OF_STAR_RATE_4"];
    case 6:
      return StarRateMessage["MESSAGE_OF_STAR_RATE_6"];
    case 8:
      return StarRateMessage["MESSAGE_OF_STAR_RATE_8"];
    case 10:
      return StarRateMessage["MESSAGE_OF_STAR_RATE_10"];
    default:
      return "";
  }
};
const createModal = () => {
  const modalBackground = document.createElement("div");
  modalBackground.classList.add("modal-background");
  const modal = document.createElement("div");
  modal.classList.add("modal");
  const modalContent = document.createElement("div");
  modalContent.classList.add("modal-content");
  const closeButton = document.createElement("button");
  closeButton.classList.add("close-modal");
  closeButton.innerHTML = `<img src="images/modal_button_close.png" />`;
  const closeModal = () => {
    modalBackground.classList.remove("active");
    document.body.classList.remove("modal-open");
  };
  const openModal = () => {
    modalBackground.classList.add("active");
    document.body.classList.add("modal-open");
  };
  closeButton.addEventListener("click", closeModal);
  modalBackground.addEventListener("click", (event) => {
    if (event.target === modalBackground) {
      closeModal();
    }
  });
  modal.appendChild(closeButton);
  modal.appendChild(modalContent);
  modalBackground.appendChild(modal);
  document.body.appendChild(modalBackground);
  return {
    show: openModal,
    hide: closeModal,
    setContent: (content) => {
      modalContent.innerHTML = content;
    }
  };
};
const movieDetailModal = createModal();
const setMovieDetailModalStarRate = (starRate, movieId) => {
  const $myStarRateContent = document.querySelector(".my-rate-content");
  if ($myStarRateContent === null) return;
  $myStarRateContent.innerHTML = `${Array.from({
    length: Math.floor(starRate / 2)
  }).map(
    (_, i) => `<img src="images/star_filled.png" class="star" data-index="${i}" data-movie-id="${movieId}" />`
  ).join("\n")}
      ${Array.from({ length: 5 - Math.floor(starRate / 2) }).map(
    (_, i) => `<img src="images/star_empty.png" class="star" data-index="${i + Math.floor(starRate / 2)}" data-movie-id="${movieId}"/>`
  ).join("\n")}`;
};
const initializeMovieDetailModalEvent = () => {
  const $myStarRateContainer = document.querySelector(".my-rate-content");
  $myStarRateContainer == null ? void 0 : $myStarRateContainer.addEventListener("click", (e) => {
    if (e.target === null) return;
    const movieId = Number(e.target.dataset.movieId);
    const starRate = 2 * (Number(e.target.dataset.index) + 1);
    if (movieId !== void 0 && starRate !== void 0) {
      setMovieStarRate(movieId, starRate);
    }
    setMovieDetailModalStarRate(starRate, movieId);
  });
};
(() => {
  movieDetailModal.setContent(`
        <div class="modal-container">
          <div class="modal-image">
            <img src="" alt="" />
          </div>
          <div class="modal-description">
            <h2 class="movie-detail-modal-title"></h2>
            <p class="category">
            </p>
            <p class="rate">
              <span>평균</span>
              <img src="images/star_filled.png" class="star" />
              <span class="movie-detail-modal-vote-average"></span>
            </p>
            </p>
            <hr />
            <div class="my-rate-container">
            <h3>내 별점</h3>
            <div style="display:flex; gap: 4px; align-items: center;">
                <div class="my-rate-content"></div>
                <span class="my-movie-star-rate"></span>
            </div>
            </div>
            <hr />
            <h3>줄거리</h3>
            <span class="movie-detail-modal-overview"></span>
          </div>
        </div>
      `);
  initializeMovieDetailModalEvent();
})();
const setMovieDetailModalContent = ({
  img,
  title,
  release_date,
  genres,
  voteAverage,
  overview,
  starRate
}) => {
  const $imageContainer = document.querySelector(".modal-image");
  const $titleContainer = document.querySelector(".movie-detail-modal-title");
  const $categoryContainer = document.querySelector(".category");
  const $voteAverageContainer = document.querySelector(
    ".movie-detail-modal-vote-average"
  );
  const $overViewContainer = document.querySelector(
    ".movie-detail-modal-overview"
  );
  const $starRateTextContainer = document.querySelector(".my-movie-star-rate");
  if (!$imageContainer || !$titleContainer || !$categoryContainer || !$voteAverageContainer || !$overViewContainer || !$starRateTextContainer)
    return;
  $imageContainer.innerHTML = `<img src="${img.src}" alt="${title}" />`;
  $titleContainer.innerHTML = title;
  $categoryContainer.innerHTML = `${release_date.split("-")[0]} · ${genres.map(({ name }) => name).join(", ")}`;
  $voteAverageContainer.innerHTML = `${voteAverage.toFixed(1)}`;
  $overViewContainer.innerHTML = overview;
  $starRateTextContainer.innerHTML = `${getStarRateMessage(
    starRate
  )} (${starRate}/10)`;
};
const MovieItem = ({ title, voteAverage, posterPath, id }) => {
  const movieItem = document.createElement("li");
  movieItem.classList.add("movie-item");
  movieItem.innerHTML = `
    <div class="item">
      <div class="thumbnail skeleton skeleton-img"></div>
      <div class="item-desc">
        <div class="skeleton skeleton-text" style="width: 40%;"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
      </div>
    </div>
  `;
  const img = new Image();
  img.src = `https://image.tmdb.org/t/p/w500${posterPath}`;
  img.alt = title;
  img.classList.add("thumbnail");
  img.onerror = () => {
    img.src = "images/nullImage.png";
  };
  img.onload = () => {
    var _a, _b;
    movieItem.innerHTML = `
      <div class="item">
        <img class="thumbnail" src="${img.src}" alt="${title}" />
        <div class="item-desc">
          <p class="rate">
            <img src="images/star_empty.png" class="star" /><span>${voteAverage.toFixed(
      1
    )}</span>
          </p>
          <strong class="movie-title">${title}</strong>
        </div>
      </div>
    `;
    const openModal = async () => {
      const { genres, overview, release_date } = await fetchDetailMovie(id);
      const myStarRate = getStarRateByMovieId(id);
      setMovieDetailModalContent({
        img,
        genres,
        overview,
        release_date,
        title,
        voteAverage,
        starRate: myStarRate
      });
      setMovieDetailModalStarRate(myStarRate, id);
      movieDetailModal.show();
    };
    (_a = movieItem.querySelector(".thumbnail")) == null ? void 0 : _a.addEventListener("click", openModal);
    (_b = movieItem.querySelector(".movie-title")) == null ? void 0 : _b.addEventListener("click", openModal);
  };
  return movieItem;
};
const MovieList = ({ movieItems = [] }) => {
  const $movieContainer = document.createElement("section");
  $movieContainer.classList.add("movie-container");
  if (movieItems.length !== 0) {
    const $ul = document.createElement("ul");
    $ul.classList.add("thumbnail-list");
    movieItems.forEach((movie) => {
      const $movieItem = MovieItem({
        title: movie.title,
        voteAverage: movie.voteAverage,
        posterPath: movie.posterPath,
        id: movie.id
      });
      $ul.appendChild($movieItem);
    });
    $movieContainer.appendChild($ul);
  }
  if (movieItems.length === 0) {
    $movieContainer.innerHTML = `
       <div class="empty-container">
        <img src="images/empty_logo.png" alt="우아한테크코스 로고" />
        <h2 class="empty-content">검색 결과가 없습니다.</h2>
      </div>
  `;
  }
  return $movieContainer;
};
const MovieContainer = ({ $movieContainer }) => {
  const resetMovieContainer = () => {
    $movieContainer.innerHTML = "";
  };
  const renderMovieContainer = () => {
    const $popularMovieList = MovieList({ movieItems: popularMovieList.list });
    const $searchedMovieList = MovieList({
      movieItems: searchedMovieList.list
    });
    resetMovieContainer();
    if (movieState.mode === "popular") {
      $movieContainer.appendChild($popularMovieList);
      return;
    }
    $movieContainer.appendChild($searchedMovieList);
  };
  return { $movieContainer, renderMovieContainer };
};
function handleSearch({
  $title,
  $mostPopularMovieBanner,
  renderMovieContainer
}) {
  return async (query) => {
    try {
      if (movieState.mode === "popular") {
        $mostPopularMovieBanner.style.display = "none";
      }
      movieState.mode = "search";
      movieState.query = query;
      await fetchSearchedMovies(query);
      renderMovieContainer();
      $title.textContent = `"${query}" 검색 결과`;
    } catch (error) {
      console.error("검색 영화 호출 중 오류 발생:", error);
      alert("검색 중 오류가 발생했습니다.");
    }
  };
}
document.addEventListener("DOMContentLoaded", async () => {
  const $main = document.querySelector("main");
  if (!$main) return;
  const $title = document.querySelector("h2");
  if (!$title) return;
  const $root = document.querySelector("#wrap");
  if (!$root) return;
  const {
    mostPopularMovieBanner: $mostPopularMovieBanner,
    renderMostPopularMovieBanner
  } = MostPopularMovieBanner();
  $root.prepend($mostPopularMovieBanner);
  $title.classList.add("main-title");
  $title.textContent = "지금 인기 있는 영화";
  const { renderMovieContainer } = MovieContainer({ $movieContainer: $main });
  const $input = Input({
    type: "text",
    placeholder: "검색어를 입력하세요",
    onSearch: handleSearch({
      $title,
      $mostPopularMovieBanner,
      renderMovieContainer
    })
  });
  const $navigationBar = NavigationBar({
    searchWrap: $input,
    routeToPopularPage: () => {
      movieState.mode = "popular";
      $title.textContent = "지금 인기 있는 영화";
      $mostPopularMovieBanner.style.display = "block";
      renderMovieContainer();
    }
  });
  $root.prepend($navigationBar);
  try {
    await fetchPopularMovies();
    if (popularMovieList.list.length > 0) {
      renderMostPopularMovieBanner();
    }
    renderMovieContainer();
  } catch (error) {
    console.error("Error in main.ts:", error);
    alert("영화 정보를 가져오는 중 오류가 발생했습니다.");
  }
  const $container = document.querySelector(".container");
  if (!$container) return;
  const throttle = (func, delay) => {
    let timeoutId = null;
    return (...args) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        func(...args);
        timeoutId = null;
      }, delay);
    };
  };
  const handleScroll = async () => {
    const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
    if (scrollHeight - scrollTop - clientHeight < 10) {
      const mode = movieState.mode;
      const isLast = isLastPage(mode);
      if (isLast) {
        return;
      }
      if (mode === "popular") {
        await fetchPopularMovies(popularMovieList.currentPage + 1);
      } else if (mode === "search") {
        await fetchSearchedMovies(
          movieState.query,
          searchedMovieList.currentPage + 1
        );
      }
      renderMovieContainer();
    }
  };
  window.addEventListener("scroll", throttle(handleScroll, 300));
});
