export const MainLoading = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen  scrollbar-hide">
      <div className="loader">
        <div className="base">
          <span></span>
          <div className="face"></div>
        </div>
      </div>
    </div>
  );
};
