// home.js
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

function Home() {
  const [user, setUser] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      history.push("/login"); // Redirect to login if not logged in
    }
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem("user"); // Clear user data
    history.push("/login"); // Redirect to login page
  };

  return (
    <div>
      <header>
        <h1>Welcome to Deep Carbon Africa</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <section>
        <h2>About Deep Carbon Africa</h2>
        <p>
          Deep Carbon Africa is dedicated to promoting sustainable farming practices by empowering farmers with innovative solutions like biochar, which enhances soil fertility and supports climate action. We work closely with local farmers to increase crop yields, restore soil health, and reduce carbon footprints.
        </p>
        <h3>Our Mission</h3>
        <p>
          Our mission is to provide farmers with tools to improve agricultural productivity while contributing to global climate change mitigation. By using biochar and other sustainable practices, we aim to help farmers and the environment thrive.
        </p>
      </section>
    </div>
  );
}

export default Home;
