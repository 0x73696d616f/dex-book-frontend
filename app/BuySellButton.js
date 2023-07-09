import React from "react";
import { Loading } from '@nextui-org/react';

const BuySellButton = ({ onClick, color, label, isLoading }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    isLoading ? <Loading color="grey" style={{ width: "100%" }} css={{ $$loadingColor: "grey" }}/> :
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