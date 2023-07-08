import React from "react";

const AmountInput = ({ setAmount, isMarketClicked, tokenASymbol, tokenBSymbol, isBuy, value }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#525257",
        borderRadius: "0.3em",
        fontFamily: "'Montserrat', sans-serif"
      }}
    >
      <label style={{ color: "white", marginLeft: "0.3em", color: "#ababab", fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>Amount</label>
      <input
        type="text"
        onChange={(e) => setAmount(e.target.value)}
        style={{
          width: "100%",
          color: "white",
          backgroundColor: "#525257",
          border: "none",
          paddingLeft: "1.9em",
          outline: "none",
          fontFamily: "'Montserrat', sans-serif"
        }}
        value= {value}
      />
      <span style={{ marginRight: "0.3em", color: "#ababab", fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>{isBuy && isMarketClicked ? tokenBSymbol : tokenASymbol}</span>
    </div>
  );
};

export default AmountInput;