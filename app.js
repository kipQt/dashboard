// App.js
import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Home from "./home";
import Login from "./login";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/home" component={Home} />
        {/* Redirect to login if no match */}
        <Route path="/" component={Login} />
      </Switch>
    </Router>
  );
}

export default App;
