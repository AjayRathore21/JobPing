import { selectUser, useUserStore } from "../store/userStore";

const DashboardPage = () => {
  const user = useUserStore(selectUser);

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      {user && <h2>Hello, {user.name || user.email}!</h2>}
    </div>
  );
};

export default DashboardPage;
