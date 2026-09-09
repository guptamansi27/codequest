import React from "react";
import "../../styles/public/Navbar.css";

const Navbar = ({ onLoginClick }) => {
  return (
    <nav className="navbar"> 
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">&lt;/&gt;</span>
          <span className="logo-text">CodeQuest</span>
        </div>
        <div className="navbar-menu">
          <button className="nav-btn login-btn" onClick={onLoginClick}>Login</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
