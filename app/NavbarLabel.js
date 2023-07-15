import React from 'react';
import { Loading } from '@nextui-org/react';
import Tooltip from '@mui/material/Tooltip';

const NavbarLabel = ({ label, isLoading, tokenSymbol, toolTipLabel }) => {
  return (
    <Tooltip title={toolTipLabel}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#282828",
          height: "100%",
          borderRadius: "0.8em",
          fontFamily: "'Montserrat', sans-serif",
          marginRight: "0.5em",
        }}
      >
        <label
          style={{
            width: "100%",
            backgroundColor: "#282828",
            border: "none",
            outline: "none",
            fontFamily: "'Montserrat', sans-serif",
            color: "#ababab",
            marginLeft: "0.5em",
            marginRight: "0.5em",
          }}
        >
          {label + ""}
        </label>
        {isLoading && (<Loading color="grey" style={{ marginRight: "0.3em" }} css={{ $$loadingColor: "grey" }} />)}
        {!isLoading && (<span style={{ marginRight: "0.3em", color: "#ababab", fontWeight: "bold", fontFamily: "'Montserrat', sans-serif" }}>{tokenSymbol}</span>)}
      </div>
    </Tooltip>
  );
};

export default NavbarLabel;