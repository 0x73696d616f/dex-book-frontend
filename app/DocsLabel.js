import React from 'react';

const DocsLabel = () => {
  return (
      <a
        href="https://0x73696d616f.github.io/dex-book-contracts/"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#282828",
          height: "100%",
          borderRadius: "0.8em",
          fontFamily: "'Montserrat', sans-serif",
          marginRight: "0.5em",
          textDecoration: "none",
        }}
      >
        <span style={{ marginLeft: "0.3em", marginRight: "0.3em", color: "#ababab", fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>Docs</span>
      </a>
  );
};

export default DocsLabel;