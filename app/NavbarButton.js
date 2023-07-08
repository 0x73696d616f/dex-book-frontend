import React from 'react';

const NavbarButton = ({ onClick, label, width, marginLeft }) => {
  return (
    <button
      style={{
        backgroundColor: "#282828",
        border: "none",
        height: "80%",
        width: width,
        color: "#fff",
        borderRadius: "0.8em",
        cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif",
        marginTop: "0.8em",
        marginRight: "0.5em",
        marginLeft: marginLeft,
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default NavbarButton;