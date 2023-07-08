import React from "react";

const LimitMarketButton = ({ isClicked, onClick, label, bgColor, width }) => {
  return (
    <button
      style={{
        marginLeft: "0.5em",
        fontFamily: 'Montserrat, sans-serif',
        backgroundColor: isClicked ? bgColor : '#525257',
        color: 'white',
        border: 'none',
        borderRadius: '0.8em',
        height: "100%",
        width: width,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default LimitMarketButton;