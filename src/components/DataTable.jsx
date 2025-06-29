import React from 'react';
import Pagination from './Pagination'; // Adjust the import path as necessary

const DataTable = ({ data, itemsPerPage, currentPage, onPageChange, isDarkMode }) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div>
        {/* Render your data here */}
        {currentData.map((item, index) => (
          <div key={index} className="p-2 border-b">
            {/* Adjust this part to render your data item as needed */}
            <p>{JSON.stringify(item)}</p>
          </div>
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        isDarkMode={isDarkMode} // Set this based on your dark mode logic
      />
    </div>
  );
};

export default DataTable;
