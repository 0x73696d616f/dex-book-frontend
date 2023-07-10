import React from 'react';

const NavbarButton = ({ onClick, label, marginLeft }) => {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#282828",
      border: "none",
      height: "100%",
      color: "#ababab",
      borderRadius: "0.8em",
      cursor: "pointer",
      fontFamily: "'Montserrat', sans-serif",
      marginRight: "0.5em",
      marginLeft: marginLeft,
    }}>
    <button
      style={{
        backgroundColor: "#282828",
        border: "none",
        color: "#ababab",
        borderRadius: "0.8em",
        fontWeight: "bold",
        cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif",
        marginLeft: "0.5em",
        marginRight: "0.5em",
      }}
      onClick={onClick}
    >
      {label}
    </button>
    </div>
  );
};

export default NavbarButton;