import React from 'react';

const SkeletonChat: React.FC = () => {
    return (
        <div className="flex items-center p-4 px-6 animate-pulse">
            <div className="w-14 h-14 bg-gray-200 dark:bg-white/5 rounded-full mr-4"></div>
            <div className="flex-1 space-y-3 py-1">
                <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/12"></div>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4"></div>
            </div>
        </div>
    );
};

export default SkeletonChat;
