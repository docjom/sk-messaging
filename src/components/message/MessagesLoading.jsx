export const MessagesLoading = () => {
  return (
    <div className="flex-1 overflow-y-auto h-96 p-4">
      {[...Array(8)].map((_, index) => {
        const isRight = Math.random() > 0.5;
        return (
          <div
            key={index}
            className={`flex mb-4 ${isRight ? "justify-end" : "justify-start"}`}
          >
            <div className="animate-pulse">
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isRight ? "bg-blue-200/50" : "bg-gray-300/50"
                }`}
              >
                {/* Sender name skeleton */}
                <div className="h-3 bg-gray-400/50 rounded w-16 mb-2"></div>
                {/* Message content skeleton - vary lengths for realism */}
                <div className="space-y-1">
                  <div className="h-3 bg-gray-400/50 rounded w-full"></div>
                  {Math.random() > 0.5 && (
                    <div className="h-3 bg-gray-400/50 rounded w-3/4"></div>
                  )}
                </div>
              </div>
              {/* Timestamp skeleton */}
              <div
                className={`h-2 bg-gray-400/50 rounded w-12 mt-1 ${
                  isRight ? "ml-auto" : "mr-auto"
                }`}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
