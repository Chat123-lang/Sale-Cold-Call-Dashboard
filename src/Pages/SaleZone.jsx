import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import Search from '../components/Search';
import Pagination from '../components/Pagination';
import ShopDetails from '../components/ShopDetails';
import { RestaurantIcon, CafeIcon, FilterIcon } from 'src/Icons';
import takeawayImg from '../images/takeaway.png';
import sadMaskImg from '../images/sad-mask.png';

const SaleZone = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ city: '', postcode: '', category: 'takeaway' });
  const [tempFilters, setTempFilters] = useState({ city: '', postcode: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // API-related state
  const [shopData, setShopData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  //
  const [allShopsForFilters, setAllShopsForFilters] = useState([]);
  const itemsPerPage = 10;
  const isDarkMode = true;

  // C
  const categoryMapping = {
    'takeaway': { label: 'Takeaway', searchText: 'takeaway' },
    'restaurants': { label: 'Restaurant', searchText: 'restaurants' },
    'cafe': { label: 'Café', searchText: 'cafe' }
  };

  const orderedCategories = Object.keys(categoryMapping);

  // Transform API data to match existing structure
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

  const extractCityFromAddress = (address) => {
    if (!address) return 'Unknown';
    const parts = address.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : 'Unknown';
  };

  const fetchShopData = async (page = 1, showPageLoader = false, searchText = null) => {
    try {
      if (showPageLoader) {
        setPageLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 
      const currentSearchText = searchText || categoryMapping[filters.category]?.searchText || 'takeaway';
      const url = `https://sale.mega-data.co.uk/google-map-data/?search_txt=${currentSearchText}&page=${page}`;

      console.log(`Fetching data from URL: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.results && Array.isArray(data.results)) {
        const transformedData = transformApiData(data.results);
        setShopData(transformedData);

        // 
        setTotalPages(data.totalPages || 0);
        setCurrentPage(data.currentPage || page);

        // 
        setTotalCount((data.totalPages || 0) * 10);

        // Store all shops for filter options 
        if (page === 1 && !showPageLoader) {
          setAllShopsForFilters(transformedData);
        }
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError(err.message);
      setShopData([]);
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  };

  const fetchAllShopsForFilters = async (searchText = 'takeaway') => {
    try {
      // 
      const responses = await Promise.all([
        fetch(`https://sale.mega-data.co.uk/google-map-data/?search_txt=${searchText}&page=1`),
        fetch(`https://sale.mega-data.co.uk/google-map-data/?search_txt=${searchText}&page=2`),
        fetch(`https://sale.mega-data.co.uk/google-map-data/?search_txt=${searchText}&page=3`)
      ]);
      const allData = [];
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.results) {
            allData.push(...transformApiData(data.results));
          }
        }
      }
      setAllShopsForFilters(allData);
    } catch (err) {
      console.error('Error fetching filter data:', err);
      setAllShopsForFilters(shopData);
    }
  };

  useEffect(() => {
    const initialSearchText = categoryMapping[filters.category]?.searchText || 'takeaway';
    fetchShopData(1, false, initialSearchText);
    fetchAllShopsForFilters(initialSearchText);
  }, []);

  const handlePageChange = (newPage) => {
    console.log('Changing page to:', newPage);
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      // FIX: Pass current category's search text when changing pages
      const currentSearchText = categoryMapping[filters.category]?.searchText || 'takeaway';
      fetchShopData(newPage, true, currentSearchText);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const uniqueCities = [...new Set(allShopsForFilters.map((shop) => shop.city))];
  const uniquePostcodes = [...new Set(allShopsForFilters.map((shop) => shop.postcode))];

  const handleCategoryClick = (category) => {
    const newCategory = filters.category === category ? 'takeaway' : category;
    setFilters((prev) => ({
      ...prev,
      category: newCategory,
      // FIX: Reset city and postcode filters when changing category
      city: '',
      postcode: ''
    }));
    // FIX: Reset temp filters as well
    setTempFilters({ city: '', postcode: '' });
    setCurrentPage(1);

    // Fetch data with new search_txt
    const searchText = categoryMapping[newCategory]?.searchText || 'takeaway';
    fetchShopData(1, true, searchText);
    fetchAllShopsForFilters(searchText);
  };

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

  const handleApplyFilters = () => {
    setFilters((prev) => ({
      ...prev,
      city: tempFilters.city,
      postcode: tempFilters.postcode,
    }));
    setShowFilters(false);
    setCurrentPage(1);
    // FIX: Pass current category's search text when applying filters
    const currentSearchText = categoryMapping[filters.category]?.searchText || 'takeaway';
    fetchShopData(1, true, currentSearchText);
  };

  const filteredShops = shopData.filter((shop) => {
    const matchesCity = filters.city ? shop.city === filters.city : true;
    const matchesPostcode = filters.postcode ? shop.postcode === filters.postcode : true;
    const matchesSearch = searchTerm
      ? Object.values(shop).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      : true;
    return matchesCity && matchesPostcode && matchesSearch;
  });

  const handleRowClick = (shop) => {
    setSelectedShop(shop);
  };

  const handleClose = () => {
    setSelectedShop(null);
  };

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

  useEffect(() => {
    console.log('Current Page:', currentPage);
    console.log('Total Pages:', totalPages);
    console.log('Total Count:', totalCount);
    console.log('Filtered Shops:', filteredShops.length);
  }, [currentPage, totalPages, totalCount, filteredShops]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-gray-900 text-white min-h-screen`}>
        <header className={`p-0 shadow-sm bg-gray-800`}>
          <div className="container mx-auto">
            <div className={`flex px-3 py-4 rounded-b-2xl bg-gray-700`}>
              {orderedCategories.map((category) => (
                <button
                  key={category}
                  disabled={true}
                  className={`flex-1 flex items-center justify-center gap-2 text-lg border-0 transition-all duration-300 text-center py-4 bg-gray-700 text-gray-400 opacity-50`}
                >
                  {getIconForCategory(category)}
                  <span>{categoryMapping[category]?.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>
        <main className={`container mx-auto p-4 space-y-6`}>
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

  // Error state
  if (error) {
    return (
      <div className={`bg-gray-900 text-white min-h-screen`}>
        <header className={`p-0 shadow-sm bg-gray-800`}>
          <div className="container mx-auto">
            <div className={`flex px-3 py-4 rounded-b-2xl bg-gray-700`}>
              {orderedCategories.map((category) => (
                <button
                  key={category}
                  disabled={true}
                  className={`flex-1 flex items-center justify-center gap-2 text-lg border-0 transition-all duration-300 text-center py-4 bg-gray-700 text-gray-400 opacity-50`}
                >
                  {getIconForCategory(category)}
                  <span>{categoryMapping[category]?.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>
        <main className={`container mx-auto p-4 space-y-6`}>
          <div className="flex flex-col items-center justify-center p-8 mt-20">
            <img src={sadMaskImg} alt="Error" className="w-32 h-32 mb-4" />
            <p className="text-white text-2xl font-medium text-center mb-4" style={{ lineHeight: '1.5' }}>
              Sorry! Unable to load shop data.
            </p>
            <p className="text-gray-400 text-center mb-6">
              Error: {error}
            </p>
            <button
              onClick={() => {
                const currentSearchText = categoryMapping[filters.category]?.searchText || 'takeaway';
                fetchShopData(currentPage, true, currentSearchText);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 text-white min-h-screen`}>
      <header className={`p-0 shadow-sm bg-gray-800`}>
        <div className="container mx-auto">
          <div className={`flex px-3 py-4 rounded-b-2xl bg-gray-700`}>
            {orderedCategories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                disabled={pageLoading}
                className={`flex-1 flex items-center justify-center gap-2 text-lg border-0 transition-all duration-300 text-center py-4 ${
                  filters.category === category
                    ? 'bg-gray-600 text-gray-200 scale-95 rounded-lg'
                    : 'bg-gray-700 text-gray-400'
                } ${pageLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {getIconForCategory(category)}
                <span>{categoryMapping[category]?.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className={`container mx-auto p-4 space-y-6`}>
        <div className="flex justify-between items-center mt-5 pb-4">
          <div className="max-w-md md:max-w-xl lg:max-w-2xl flex-grow">
            <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} isDarkMode={isDarkMode} />
          </div>
          <div className="flex items-center space-x-3 ml-4">
            <div className="relative inline-block text-left">
              <button
                onClick={() => {
                  setTempFilters({
                    city: filters.city,
                    postcode: filters.postcode,
                  });
                  setShowFilters(true);
                }}
                disabled={pageLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors bg-gray-700 border text-gray-200 hover:bg-gray-600 ${pageLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FilterIcon fill={'white'} />
                <span>Filter</span>
              </button>
              {showFilters && (
                <>
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setShowFilters(false)}
                  ></div>
                  <div
                    className={`absolute right-4 mt-2 w-72 rounded-md shadow-lg z-50 bg-gray-800 border border-gray-700`}
                  >
                    <div className="p-4">
                      <div className="mb-4">
                        <label htmlFor="filter-city" className={`block text-xs font-medium mb-1 text-gray-300`}>
                          Select a city
                        </label>
                        <select
                          id="filter-city"
                          value={tempFilters.city}
                          onChange={handleCityChange}
                          className={`w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600`}
                        >
                          <option value="">All Cities</option>
                          {uniqueCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="filter-postcode" className={`block text-xs font-medium mb-1 text-gray-300`}>
                          Select a postcode
                          {tempFilters.city && <span className="text-xs ml-1 opacity-75">({tempFilters.city})</span>}
                        </label>
                        <select
                          id="filter-postcode"
                          value={tempFilters.postcode}
                          onChange={handlePostcodeChange}
                          disabled={!tempFilters.city}
                          className={`w-full px-3 py-2 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600`}
                        >
                          <option value="">
                            {tempFilters.city
                              ? `All ${tempFilters.city} Postcodes`
                              : 'Select a city first'}
                          </option>
                          {tempFilters.city
                            ? allShopsForFilters
                                .filter((shop) => shop.city === tempFilters.city)
                                .map((shop) => shop.postcode)
                                .filter((pc, i, self) => self.indexOf(pc) === i)
                                .map((postcode) => (
                                  <option key={postcode} value={postcode}>
                                    {postcode}
                                  </option>
                                ))
                            : uniquePostcodes.map((postcode) => (
                                <option key={postcode} value={postcode}>
                                  {postcode}
                                </option>
                              ))}
                        </select>
                      </div>
                      {!tempFilters.city && (
                        <p className={`mt-1 text-xs text-gray-400`}>
                          Select a city to see postcodes
                        </p>
                      )}
                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setShowFilters(false)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300`}
                        >
                          Close
                        </button>
                        <button
                          onClick={handleApplyFilters}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 text-sm rounded transition-colors whitespace-nowrap"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current Category Display */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-200 mb-2">
            {categoryMapping[filters.category]?.label || 'Takeaway'} Shops
          </h2>
          <p className="text-sm text-gray-400">
            Showing results for: {categoryMapping[filters.category]?.searchText || 'takeaway'}
          </p>
        </div>

        {/* Page Loading Indicator */}
        {pageLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Loading page {currentPage}...</p>
            </div>
          </div>
        )}

        {!pageLoading && filteredShops.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8">
            <img src={sadMaskImg} alt="Sad Mask" className="w-32 h-32 mb-4" />
            <p className="text-white text-2xl font-medium text-center" style={{ lineHeight: '1.5' }}>
              Sorry! No results match your search or filters. <br /> Please try again.
            </p>
          </div>
        ) : (
          !pageLoading && (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} shops
                </p>
                <p className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
              </div>

              {/* Render all shops in a single table */}
              <div className="space-y-8">
                <div className="bg-gray-800 rounded-lg p-6">
                  <Table
                    shops={filteredShops}
                    isDarkMode={isDarkMode}
                    onRowClick={handleRowClick}
                  />
                </div>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isDarkMode={isDarkMode}
              />
            </>
          )
        )}
      </main>

      {selectedShop && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4">
          <div
            className={`relative rounded-lg shadow-xl overflow-auto max-w-5xl w-full bg-gray-800`}
            style={{ maxHeight: '90vh' }}
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-white text-2xl font-bold z-10"
            >
              &times;
            </button>
            <ShopDetails
              shop={selectedShop}
              calls={[]}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleZone;