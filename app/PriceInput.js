import React from "react";

const PriceInput = ({ isLimitClicked, setPrice, isMarketClicked, tokenSymbol, value }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "100%",
        backgroundColor: isLimitClicked ? "#525257" : "grey",
        borderRadius: "0.3em"
      }}
    >
      <label style={{ color: "white", marginLeft: "0.3em", color: "#ababab", fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>Price</label>
      <input
        type="text"
        onChange={(e) => setPrice(e.target.value)}
        style={{
          width: "100%",
          color: isMarketClicked ? "grey" : "white",
          backgroundColor: isLimitClicked ? "#525257" : "transparent",
          border: "none",
          paddingLeft: "4em",
          outline: "none",
          fontFamily: 'Montserrat, sans-serif',
        }}
        value={value}
        disabled={isMarketClicked}
      />
      <span style={{ marginRight: "0.3em", color: "#ababab", fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>{tokenSymbol}</span>
    </div>
  );
};

export default PriceInput;