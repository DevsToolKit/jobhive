import React from 'react';

function DashboardSkeleton() {
  return (
    <div className="px-6 py-3">
      <div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {Array.from({ length: 15 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

const CardSkeleton = () => {
  return (
    <div className="w-full h-[400px] bg-gray-100 dark:bg-card animate-pulse rounded-[20px] pb-20 p-1">
      <div className="w-full h-full mb-20 dark:bg-card-secondary rounded-[18px]"></div>
    </div>
  );
};

export default DashboardSkeleton;
