import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import Table from '../components/Table';
import Search from '../components/Search';
import Pagination from '../components/Pagination';
import ShopDetails from '../components/ShopDetails';
import { RestaurantIcon, CafeIcon, FilterIcon } from 'src/Icons';
import takeawayImg from '../images/takeaway.png';
import sadMaskImg from '../images/sad-mask.png';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Helper to transform API data
const transformApiData = (apiResults) => {
  return apiResults.map((item, index) => ({
    id: item.shop_id_company || `shop-${Date.now()}-${index}`,
    name: item.shop_name || 'Unknown Shop',
    serviceType: item.category || 'Unknown',
    postcode: item.postcode || 'N/A',
    city: extractCityFromAddress(item.address) || 'Unknown',
    website: item.website || '',
    status: item.is_open_now ? 'open' : 'closed',
    address: item.address || '',
    phone: item.phone || '',
    rating: item.rating || 'N/A',
    total_reviews: item.total_reviews || 0,
    latitude: item.latitude || '',
    longitude: item.longitude || '',
    opening_hours: item.opening_hours || '',
    services: item.services || '',
    providers: item.providers || '',
    provider_url: item.provider_url || '',
    search_txt: item.search_txt || '',
    category: item.category || 'Unknown'
  }));
};

// Helper to extract city from address string
const extractCityFromAddress = (address) => {
  if (!address) return 'Unknown';
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : 'Unknown';
};

// Main component for displaying and managing shop data
const SaleZone = () => {
  const queryClient = useQueryClient();

  // State for search term and filters
  const [searchInput, setSearchInput] = useState(''); 
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); 
  const [filters, setFilters] = useState({ city: '', postcode: '', category: 'takeaway' });
  const [tempFilters, setTempFilters] = useState({ city: '', postcode: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Constants
  const itemsPerPage = 10;
  const isDarkMode = true;

  // Mapping for categories to their labels and search texts
  const categoryMapping = {
    'takeaway': { label: 'Takeaway', searchText: 'takeaway' },
    'restaurants': { label: 'Restaurant', searchText: 'restaurants' },
    'cafe': { label: 'Café', searchText: 'cafe' }
  };
  const orderedCategories = Object.keys(categoryMapping);

  // --- React Query for Main Shop Data ---
  const {
    data: mainShopData,
    isLoading: isMainDataLoading,
    isFetching: isMainDataFetching,
    error: mainDataError,
    refetch: refetchMainData
  } = useQuery({
    queryKey: ['shops', filters.category, currentPage],
    queryFn: async () => {
      const currentSearchText = categoryMapping[filters.category]?.searchText || 'takeaway';
      const url = `https://sale.mega-data.co.uk/google-map-data/?search=${currentSearchText}&page=${currentPage}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.results && Array.isArray(data.results)) {
        return {
          transformedData: transformApiData(data.results),
          totalPages: data.totalPages || 0,
          currentPage: data.currentPage || currentPage,
        };
      } else {
        throw new Error('Invalid API response format');
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  // --- React Query for Search Results ---
  const {
    data: searchResultsData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
    error: searchError,
    refetch: refetchSearchResults,
    isFetched: searchResultsFetched,
  } = useQuery({
    queryKey: ['searchResults', filters.category, debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) return [];

      const currentCategory = filters.category;
      const searchText = categoryMapping[currentCategory]?.searchText || 'takeaway';
      
      const searchPromises = [1, 2, 3].map(async (page) => {
        const url = `https://sale.mega-data.co.uk/google-map-data/?search=${searchText}&page=${page}`;
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'accept': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.results && Array.isArray(data.results)) {
              return transformApiData(data.results);
            }
          }
          return [];
        } catch (err) {
          console.error(`Error searching ${currentCategory} page ${page}:`, err);
          return [];
        }
      });

      const allResults = await Promise.all(searchPromises);
      const combinedResults = allResults.flat();

      // Filter results by search query client-side from combined results
      const filteredResults = combinedResults.filter((shop) => {
        const searchLower = debouncedSearchQuery.toLowerCase(); 
        return (
          shop.name.toLowerCase().includes(searchLower) ||
          shop.phone.toLowerCase().includes(searchLower) ||
          shop.postcode.toLowerCase().includes(searchLower) ||
          shop.address.toLowerCase().includes(searchLower) ||
          shop.city.toLowerCase().includes(searchLower)
        );
      });

      // Remove duplicates
      const uniqueResults = filteredResults.filter((shop, index, self) =>
        index === self.findIndex((s) => s.id === shop.id)
      );
      return uniqueResults;
    },
    enabled: !!debouncedSearchQuery.trim(),
    staleTime: 1 * 60 * 1000,
  });

  // Debounce logic for setting the actual query term
  const debounceTimer = useRef(null); 

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set a new timer to update debouncedSearchQuery after delay
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearchQuery(searchInput); 
    }, 500);

    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput]); 

  // Clear debouncedSearchQuery and searchInput when category changes
  useEffect(() => {
    // This will cause a refetch of searchResults if debouncedSearchQuery was not empty
    // and then clear it, effectively resetting search when category changes.
    setSearchInput('');
    setDebouncedSearchQuery('');
    queryClient.invalidateQueries(['searchResults']); 
  }, [filters.category, queryClient]); 

  // --- React Query for All Shops for Filters (Cached for select options) ---
  const { data: allShopsForFiltersData } = useQuery({
    queryKey: ['allShopsForFilters', filters.category],
    queryFn: async () => {
      const initialSearchText = categoryMapping[filters.category]?.searchText || 'takeaway';
      const fetchPromises = [1, 2, 3].map(async (page) => {
        const url = `https://sale.mega-data.co.uk/google-map-data/?search=${initialSearchText}&page=${page}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          return data.results ? transformApiData(data.results) : [];
        }
        return [];
      });
      const allData = (await Promise.all(fetchPromises)).flat();
      return allData;
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  // Derive state from React Query
  const shopData = mainShopData?.transformedData || [];
  const totalPages = mainShopData?.totalPages || 0;
  const totalCount = totalPages * itemsPerPage;
  const isPageLoading = isMainDataFetching;
  const isLoadingInitial = isMainDataLoading && !mainShopData;

  // Combined loading state for UI
  const overallLoading = isLoadingInitial || isPageLoading || isSearchFetching;

  // Handle page change for pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle category click to filter shops by category
  const handleCategoryClick = (category) => {
    const newCategory = category;
    setFilters((prev) => ({
      ...prev,
      category: newCategory,
      city: '',
      postcode: ''
    }));
    setTempFilters({ city: '', postcode: '' });
    setCurrentPage(1);

    // Invalidate main shops and all shops for filters queries to refetch with new category
    queryClient.invalidateQueries(['shops', newCategory]);
    queryClient.invalidateQueries(['allShopsForFilters', newCategory]);
    
    
  };


  // Handle city and postcode filter changes
  const handleCityChange = (e) => {
    const city = e.target.value;
    setTempFilters({
      ...tempFilters,
      city,
      postcode: '',
    });
  };

  const handlePostcodeChange = (e) => {
    const postcode = e.target.value;
    setTempFilters({
      ...tempFilters,
      postcode,
    });
  };

  // Apply filters and fetch filtered data
  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      city: tempFilters.city,
      postcode: tempFilters.postcode,
    }));
    setShowFilters(false);
    setCurrentPage(1);
    // Invalidate main shops query to refetch with new filters (React Query handles combining with category and page)
    queryClient.invalidateQueries(['shops', filters.category]);
  };

  // Get unique cities and postcodes for filter options
  const uniqueCities = [...new Set(allShopsForFiltersData?.map((shop) => shop.city) || [])];
  const uniquePostcodes = [...new Set(allShopsForFiltersData?.map((shop) => shop.postcode) || [])];
  
  const filteredPostcodesByCity = tempFilters.city
    ? [...new Set(allShopsForFiltersData?.filter((shop) => shop.city === tempFilters.city).map((shop) => shop.postcode) || [])]
    : uniquePostcodes;

  // Determine which shops to display: search results or main category data
  // isSearchMode is true if there's a debounced query and results have been fetched
  const isSearchMode = debouncedSearchQuery.trim().length > 0 && searchResultsFetched;
  const displayShops = (isSearchMode ? (searchResultsData || []) : shopData).filter((shop) => {
    const matchesCity = filters.city ? shop.city === filters.city : true;
    const matchesPostcode = filters.postcode ? shop.postcode === filters.postcode : true;
    return matchesCity && matchesPostcode;
  });

  // Handle row click to show shop details
  const handleRowClick = (shop) => {
    setSelectedShop(shop);
  };

  // Handle close of shop details modal
  const handleClose = () => {
    setSelectedShop(null);
  };

  // Get icon for category
  const getIconForCategory = (category) => {
    switch (category) {
      case 'takeaway':
        return <img src={takeawayImg} alt="Takeaway" className="w-10 h-10 bg-transparent rounded-full" />;
      case 'restaurants':
        return <RestaurantIcon />;
      case 'cafe':
        return <CafeIcon />;
      default:
        return null;
    }
  };

  // Render loading state
  if (isLoadingInitial) {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <header className="p-0 shadow-sm bg-gray-800">
          <div className="container mx-auto">
            <div className="flex px-3 py-4 rounded-b-2xl bg-gray-700">
              {orderedCategories.map((category) => (
                <button key={category} disabled className="flex-1 flex items-center justify-center gap-2 text-lg border-0 transition-all duration-300 text-center py-4 bg-gray-700 text-gray-400 opacity-50">
                  {getIconForCategory(category)}
                  <span>{categoryMapping[category]?.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 space-y-6">
          <div className="flex justify-center items-center mt-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-xl text-gray-300">Loading shop data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render error state
  if (mainDataError) {
    return (
      <div className="bg-gray-900 text-white min-h-screen">
        <header className="p-0 shadow-sm bg-gray-800">
          <div className="container mx-auto">
            <div className="flex px-3 py-4 rounded-b-2xl bg-gray-700">
              {orderedCategories.map((category) => (
                <button key={category} disabled className="flex-1 flex items-center justify-center gap-2 text-lg border-0 transition-all duration-300 text-center py-4 bg-gray-700 text-gray-400 opacity-50">
                  {getIconForCategory(category)}
                  <span>{categoryMapping[category]?.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>
        <main className="container mx-auto p-4 space-y-6">
          <div className="flex flex-col items-center justify-center p-8 mt-20">
            <img src={sadMaskImg} alt="Error" className="w-32 h-32 mb-4" />
            <p className="text-white text-2xl font-medium text-center mb-4" style={{ lineHeight: '1.5' }}>
              Sorry! Unable to load shop data.
            </p>
            <p className="text-gray-400 text-center mb-6">Error: {mainDataError.message}</p>
            <button onClick={() => refetchMainData()} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded transition-colors">
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Render main content
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="p-0 shadow-sm bg-gray-800">
        <div className="container mx-auto">
          <div className="flex px-3 py-4 rounded-b-2xl bg-gray-700">
            {orderedCategories.map((category) => (
              <button key={category} onClick={() => handleCategoryClick(category)} disabled={overallLoading} className={`flex-1 flex items-center justify-center gap-2 text-lg border-0 transition-all duration-300 text-center py-4 ${filters.category === category ? 'bg-gray-600 text-gray-200 scale-95 rounded-lg' : 'bg-gray-700 text-gray-400'} ${overallLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {getIconForCategory(category)}
                <span>{categoryMapping[category]?.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center mt-5 pb-4">
          <div className="max-w-md md:max-w-xl lg:max-w-2xl flex-grow">
            {/* Pass searchInput and setSearchInput directly for immediate feedback */}
            <Search searchTerm={searchInput} setSearchTerm={setSearchInput} isDarkMode={isDarkMode} isLoading={isSearchLoading || isSearchFetching} />
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <div className="relative inline-block text-left">
              <button onClick={() => { setTempFilters({ city: filters.city, postcode: filters.postcode }); setShowFilters(true); }} disabled={overallLoading} className={`flex items-center gap-2 px-4 py-2 rounded transition-colors bg-gray-700 border text-gray-200 hover:bg-gray-600 ${overallLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <FilterIcon fill={'white'} />
                <span>Filter</span>
              </button>
              {showFilters && (
                <>
                  <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setShowFilters(false)}></div>
                  <div className="absolute right-4 mt-2 w-72 rounded-md shadow-lg z-50 bg-gray-800 border border-gray-700">
                    <div className="p-4">
                      <div className="mb-4">
                        <label htmlFor="filter-city" className="block text-xs font-medium mb-1 text-gray-300">Select a city</label>
                        <select id="filter-city" value={tempFilters.city} onChange={handleCityChange} className="w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600">
                          <option value="">All Cities</option>
                          {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="filter-postcode" className="block text-xs font-medium mb-1 text-gray-300">Select a postcode {tempFilters.city && <span className="text-xs ml-1 opacity-75">({tempFilters.city})</span>}</label>
                        <select id="filter-postcode" value={tempFilters.postcode} onChange={handlePostcodeChange} disabled={!tempFilters.city} className="w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600">
                          <option value="">{tempFilters.city ? `All ${tempFilters.city} Postcodes` : 'Select a city first'}</option>
                          {filteredPostcodesByCity.map((postcode) => <option key={postcode} value={postcode}>{postcode}</option>)}
                        </select>
                      </div>
                      {!tempFilters.city && <p className="mt-1 text-xs text-gray-400">Select a city to see postcodes</p>}
                      <div className="flex justify-between pt-2">
                        <button onClick={() => setShowFilters(false)} className="px-3 py-1.5 text-sm rounded transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300">Close</button>
                        <button onClick={handleApplyFilters} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-sm rounded transition-colors whitespace-nowrap">Apply</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          {isSearchMode ? (
            <div>
              {/* Display searchInput for immediate feedback, but debouncedSearchQuery for actual query */}
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Search Results for "{debouncedSearchQuery}" in {categoryMapping[filters.category]?.label}</h2>
              <p className="text-sm text-gray-400">{isSearchLoading || isSearchFetching ? 'Searching...' : `Found ${displayShops.length} results in ${categoryMapping[filters.category]?.label} category`}</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-2">{categoryMapping[filters.category]?.label || 'Takeaway'} Shops</h2>
            </div>
          )}
        </div>

        {/* Loading indicators */}
        {(isSearchLoading || isSearchFetching) && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Searching in {categoryMapping[filters.category]?.label} category...</p>
            </div>
          </div>
        )}

        {isPageLoading && !isSearchMode && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Loading page {currentPage}...</p>
            </div>
          </div>
        )}
        
        {/* Error messages */}
        {searchError && (
          <div className="flex flex-col items-center justify-center p-8">
            <img src={sadMaskImg} alt="Error" className="w-32 h-32 mb-4" />
            <p className="text-white text-2xl font-medium text-center mb-4" style={{ lineHeight: '1.5' }}>Search Error</p>
            <p className="text-gray-400 text-center mb-6">Error: {searchError.message}</p>
            <button onClick={() => refetchSearchResults()} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded transition-colors">Try Again</button>
          </div>
        )}

        {/* No results message */}
        {!overallLoading && !mainDataError && !searchError && displayShops.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <img src={sadMaskImg} alt="Sad Mask" className="w-32 h-32 mb-4" />
            <p className="text-white text-2xl font-medium text-center" style={{ lineHeight: '1.5' }}>{isSearchMode ? `No results found for "${debouncedSearchQuery}" in ${categoryMapping[filters.category]?.label}` : "Sorry! No results match your filters."} <br /> Please try again.</p>
          </div>
        ) : (
          // Display table and pagination
          !overallLoading && !mainDataError && !searchError && (
            <>
              <div className="flex justify-between items-center mb-4">
                {isSearchMode ? (
                  <p className="text-sm text-gray-400">Showing {displayShops.length} search results in {categoryMapping[filters.category]?.label}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} shops</p>
                    <p className="text-sm text-gray-400">Page {currentPage} of {totalPages}</p>
                  </>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-gray-800 rounded-lg p-6">
                  <Table shops={displayShops} isDarkMode={isDarkMode} onRowClick={handleRowClick} />
                </div>
              </div>
              
              {!isSearchMode && (
                <div className="mt-12 mb-8"> 
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} isDarkMode={isDarkMode} />
                </div>
              )}
            </>
          )
        )}
      </main>

      {selectedShop && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <div className="relative rounded-lg shadow-xl overflow-auto max-w-5xl w-full bg-gray-800" style={{ maxHeight: '90vh' }}>
            <button onClick={handleClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl font-bold z-10">&times;</button>
            <ShopDetails shop={selectedShop} calls={[]} isDarkMode={isDarkMode} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleZone;