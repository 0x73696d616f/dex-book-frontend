import React from "react";

const BuySellButton = ({ onClick, color, label }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        width: "100%",
        margin: "0.5em",
        color: color,
        backgroundColor: "#525257",
        fontFamily: "'Montserrat', sans-serif",
        height: "100%",
        border: "none",
        borderRadius: "0.5em",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      {label}
    </button>
  );
};

export default BuySellButton;