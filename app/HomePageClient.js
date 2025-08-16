
const HomePageClient = ({ initialBooks, initialCategories, defaultPage, defaultLimit }) => {
  const { theme } = React.useContext(ThemeContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); // Keep for debounce logic if needed elsewhere
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [books, setBooks] = useState(initialBooks); // Start with initialBooks
  const [categories, setCategories] = useState(initialCategories); // Start with initialCategories

  // Pagination states
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [booksPerPage] = useState(defaultLimit);
  const [totalBooksCount, setTotalBooksCount] = useState(0); // Will be updated from X-Total-Count header
  const [hasMore, setHasMore] = useState(true);

  const { data: fetchResponse, loading, error, refetch } = useFetch(null); // Pass null initially

  // Effect to trigger initial fetch on component mount
  useEffect(() => {
    const url = `${API_URL}/api/books?page=${defaultPage}&limit=${defaultLimit}`;
    refetch(url);
  }, [defaultPage, defaultLimit, refetch]); // Dependencies for initial fetch

  // Effect to handle fetched data, append books for pagination, and update total count
  useEffect(() => {
    if (fetchResponse) {
      const newBooks = fetchResponse.data;
      const totalCount = parseInt(fetchResponse.headers['x-total-count'], 10);

      setTotalBooksCount(totalCount);
      // Determine if there are more books to load
      setHasMore(currentPage * booksPerPage < totalCount);

      // Only update books if new data is available
      if (newBooks && newBooks.length > 0) {
        if (currentPage === 1) {
          // If it's the first page (new search or initial load), replace books
          setBooks(newBooks);
        } else {
          // For subsequent pages (load more), append books
          setBooks((prevBooks) => [...prevBooks, ...newBooks]);
        }
      } else if (currentPage === 1) {
        // If no new books and it's the first page, clear the list (e.g., no results for search)
        setBooks([]);
      }

      // Update categories based on fetched books (only if not actively searching)
      // This ensures category list updates with available categories for current filter
      if (!searchTerm) { // Use searchTerm directly here as debouncedSearchTerm is for triggering
        const uniqueCategories = ["الكل", ...new Set(newBooks.map(book => book.category))];
        setCategories(uniqueCategories);
      }
    }
  }, [fetchResponse, currentPage, booksPerPage, searchTerm]); // Changed debouncedSearchTerm to searchTerm

  // Function to construct the URL for fetching books
  const constructFetchUrl = useCallback((page, query, category) => {
    let url = `${API_URL}/api/books?page=${page}&limit=${booksPerPage}`;
    if (query) {
      url += `&query=${query}`;
    }
    if (category !== "الكل") {
      url += `&category=${category}`;
    }
    return url;
  }, [booksPerPage]); // booksPerPage is stable

  const handleSearchSubmit = () => {
    setCurrentPage(1); // Reset page for new search
    const url = constructFetchUrl(1, searchTerm, selectedCategory);
    refetch(url);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      const url = constructFetchUrl(nextPage, searchTerm, selectedCategory);
      refetch(url); // Trigger fetch for next page
    }
  };

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    setCurrentPage(1); // Reset page when category changes
    const url = constructFetchUrl(1, searchTerm, newCategory);
    refetch(url); // Trigger fetch for new category
  };

  return (
    <div className="homepage-container" style={{ backgroundColor: theme.background, color: theme.primary }}>
      <h1 className="homepage-title" style={{ color: theme.primary }}>البحث عن الكتب</h1>
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="ابحث عن كتاب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown} // Add onKeyDown
          className="search-input"
          aria-label="البحث عن كتاب"
          style={{
            border: `1px solid ${theme.secondary}`,
            backgroundColor: theme.background,
            color: theme.primary,
          }}
        />
        <button
          onClick={handleSearchSubmit} // Add search button
          className="search-button"
          style={{
            backgroundColor: theme.accent,
            color: theme.primary,
            border: `1px solid ${theme.secondary}`,
            cursor: 'pointer',
            marginLeft: '10px',
          }}
        >
          بحث
        </button>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="category-select"
          aria-label="اختر فئة الكتاب"
          style={{
            border: `1px solid ${theme.secondary}`,
            backgroundColor: theme.background,
            color: theme.primary,
          }}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
      {loading && currentPage === 1 ? ( // Show loading only for first page load
        <div style={{ textAlign: "center" }}>جاري تحميل الكتب...</div>
      ) : error ? (
        <div style={{ textAlign: "center" }}>حدث خطأ أثناء تحميل الكتب.</div>
      ) : (
        <>
          <div className="books-display-container">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="load-more-button"
              style={{
                backgroundColor: theme.accent,
                color: theme.primary,
                border: `1px solid ${theme.secondary}`,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'جاري التحميل...' : 'تحميل المزيد'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default HomePageClient;
