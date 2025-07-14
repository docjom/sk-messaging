export const ChatListLoading = () => {
  return (
    <div className="space-y-1 mb-2 flex-1">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-gray-700/30 p-2  animate-pulse">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-gray-500/40">
              <div className="w-4 h-4 bg-gray-500/40 "></div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-gray-600/40  w-3/4 mb-2"></div>
              <div className="flex items-center gap-2">
                <div className="h-2 bg-gray-600/40 rounded w-12"></div>
                <div className="h-2 bg-gray-600/40 rounded w-16"></div>
                <div className="h-2 bg-gray-600/40 rounded w-10"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
