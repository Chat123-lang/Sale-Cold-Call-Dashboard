import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, totalPages, onPageChange, isDarkMode }) => {
  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generate the array of page numbers to display
  const generatePageNumbers = () => {
    const pages = [];
    const delta = 1; // Number of pages to show on each side of current page
    
    // Always show first page
    pages.push(1);
    
    // Calculate start and end of the middle range
    let start = Math.max(2, currentPage - delta);
    let end = Math.min(totalPages - 1, currentPage + delta);
    
    // Adjust start and end to show at least 3 pages in the middle when possible
    if (currentPage <= 3) {
      end = Math.min(totalPages - 1, 4);
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - 3);
    }
    
    // Add ellipsis before middle range if there's a gap
    if (start > 2) {
      pages.push('...');
    }
    
    // Add middle range pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add ellipsis after middle range if there's a gap
    if (end < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page (if it's not the first page)
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <nav aria-label="Pagination Navigation" className="flex justify-start mt-4">
      <div className={`flex items-center p-1 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
        {/* Previous Button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className={`px-3 py-1 rounded transition-colors ${
            currentPage === 1 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-600'
          } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          &lt;
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className={`px-3 py-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                ...
              </span>
            );
          }
          
          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`px-3 py-1 rounded transition-colors ${
                currentPage === page 
                  ? `font-bold ${isDarkMode ? 'bg-gray-500 text-white' : 'bg-gray-500 text-white'}` 
                  : `${isDarkMode ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-400'}`
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className={`px-3 py-1 rounded transition-colors ${
            currentPage === totalPages 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-gray-600'
          } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          &gt;
        </button>
      </div>
    </nav>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool,
};

Pagination.defaultProps = {
  isDarkMode: false,
};

export default Pagination;