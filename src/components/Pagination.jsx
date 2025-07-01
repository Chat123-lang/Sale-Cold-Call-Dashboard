// src/components/Pagination.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, totalPages, onPageChange, isDarkMode }) => {
  const [jumpPage, setJumpPage] = useState('');

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleJumpInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setJumpPage(value);
    }
  };

  const handleJumpInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const pageNumber = parseInt(jumpPage, 10);
      if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
        onPageChange(pageNumber);
        setJumpPage('');
      }
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const delta = 1;

    pages.push(1);

    let start = Math.max(2, currentPage - delta);
    let end = Math.min(totalPages - 1, currentPage + delta);

    if (currentPage <= 3) {
      end = Math.min(totalPages - 1, 4);
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - 3);
    }

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <nav aria-label="Pagination Navigation" className="flex items-center gap-3 mt-4">
      {/* Pagination with thin border */}
      <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-300 border-gray-400'}`}>
        {/* Previous Button with Separator */}
        <div className="flex items-center">
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
          {currentPage !== 1 && (
            <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
          )}
        </div>

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
            <div key={page} className="flex items-center">
              {index > 0 && (
                <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
              )}
              <button
                onClick={() => handlePageClick(page)}
                className={`px-3 py-1 rounded transition-colors ${
                  currentPage === page
                    ? `font-bold ${isDarkMode ? 'bg-gray-500 text-white' : 'bg-gray-500 text-white'}`
                    : `${isDarkMode ? 'text-white hover:bg-gray-600' : 'text-gray-900 hover:bg-gray-400'}`
                }`}
              >
                {page}
              </button>
            </div>
          );
        })}

        {/* Next Button with Separator */}
        <div className="flex items-center">
          {currentPage !== totalPages && (
            <div className={`w-px h-6 mx-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
          )}
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
      </div>

      {/* Page Jump - Separate from the bordered pagination section */}
      <div className={`flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-300 border-gray-400'}`}>
        <span className={`text-sm mr-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Jump:
        </span>
        <input
          type="text"
          value={jumpPage}
          onChange={handleJumpInputChange}
          onKeyPress={handleJumpInputKeyPress}
          placeholder={currentPage.toString()}
          className={`w-12 px-1 py-1 text-sm text-center rounded border-none outline-none ${
            isDarkMode
              ? 'bg-gray-600 text-white placeholder-gray-400'
              : 'bg-gray-200 text-gray-900 placeholder-gray-600'
          }`}
          title={`Type page number and press Enter (1-${totalPages})`}
        />
        <span className={`ml-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          /{totalPages}
        </span>
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