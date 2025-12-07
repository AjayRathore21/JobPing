const AuthCheck = () => {
  return Boolean(localStorage.getItem("token"));
};

export default AuthCheck;
