import Layout from "../layout/Layout";
import { Outlet } from "react-router-dom";

export const AdminDashboard = () => {
  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
    </>
  );
};
