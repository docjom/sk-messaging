export const AdminHome = () => {
  return (
    <div className="h-screen">
      <div className="p-2">
        <h1 className="text-2xl font-bold">Welcome Admin</h1>

        <div>
          <h2 className="text-xl font-semibold mt-4">Analytics</h2>
        </div>

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

        <div>
          <h2 className="text-xl font-semibold mt-4">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="bg-gray-50 p-2 border">Reports</div>
          <div className="bg-gray-50 p-2 border">Broadcast Announcement</div>
          <div className="bg-gray-50 p-2 border">System Maintenance Mode</div>
        </div>
      </div>
    </div>
  );
};
