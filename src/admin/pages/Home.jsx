export const AdminHome = () => {
  return (
    <div className="h-screen">
      <div className="p-2">
        <h1 className="text-2xl font-bold">Welcome Admin</h1>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-2">
          <div className="bg-gray-50 p-2 border">
            1000
            <p>Active Users</p>
          </div>
          <div className="bg-gray-50 p-2 border">
            1000
            <p>Total Users</p>
          </div>
          <div className="bg-gray-50 p-2 border">
            1000
            <p>Message Per Day</p>
          </div>
          <div className="bg-gray-50 p-2 border">
            1000
            <p>Storage used</p>
          </div>
        </div>
      </div>
    </div>
  );
};
