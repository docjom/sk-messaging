export const MessagesLoading = () => {
  return (
    <div className="flex justify-center gap-4 items-center h-full py-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>{" "}
      Loading messages...
    </div>
  );
};
