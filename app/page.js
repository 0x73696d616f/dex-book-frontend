'use client';
import Image from 'next/image'
import React, { useState } from 'react';
import styles from './page.module.css'
import { Button } from "@nextui-org/react";
import { Input } from "@nextui-org/react";

export default function Home() {
  const [isMarketClicked, setMarketClicked] = useState(false);
  const [isLimitClicked, setLimitClicked] = useState(true);

  const buyButton = {width: "100%", margin: "0.5em", backgroundColor: "#12400b", fontFamily: 'Montserrat, sans-serif'}
  const sellButton = {width: "100%", margin: "0.5em", backgroundColor: "#691111", fontFamily: 'Montserrat, sans-serif'}
  const switchButton = {marginLeft: "0.5em", fontFamily: 'Montserrat, sans-serif'}

  const handleMarketClick = () => {
    setMarketClicked(true);
    setLimitClicked(false);
  };

  const handleLimitClick = () => {
    setMarketClicked(false);
    setLimitClicked(true);
  };

  return (
    <div className={styles.myApp}>
      <nav className={styles.navbar}>
        <h1>DexBook</h1>
        <Button hover style={{position: "absolute", right: "0.5em", top: "0.5em", backgroundColor: "#282828"}}>Connect Wallet</Button>
      </nav>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.fortyFivePercentLine}>Line 1 (45%)</div>
          <div className={styles.tenPercentLine}>Line 2 (10%)</div>
          <div className={styles.fortyFivePercentLine}>Line 3 (45%)</div>
        </div>
        <div className={styles.column}>
          <div className={styles.sixtyPercentLine}>Line 2 (60%)</div>
          <div className={styles.fortyPercentLine}>
            <div className={styles.buySellMenu}>
            <div className={styles.switchContainer}>
              <Button size="xs" style={isLimitClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleLimitClick}>Limit</Button>    
              <Button size="xs" style={isMarketClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleMarketClick}>Market</Button>          
            </div>
              <div className={styles.buttonContainer}>
                <div className={styles.menuItem}>
                  <Input color="white" width="100%" disabled={isMarketClicked} labelRight={"USDC"} placeholder="price" css={isLimitClicked ? { $$inputColor: "#525257"} : { $$inputColor: "grey"}}/>
                </div>
                <div className={styles.menuItem}>
                  <Input color="white" width="100%" disabled={isMarketClicked} labelRight={"USDC"} placeholder="price" css={isLimitClicked ? { $$inputColor: "#525257"} : { $$inputColor: "grey"}}/>
                </div>
              </div>
              <div className={styles.buttonContainer}>
                <div className={styles.menuItem}>
                  <Input color="white" width="100%" placeholder="amount" labelRight={isLimitClicked? "USDC" : "WETH"} css={{ $$inputColor: "#525257" }}/>
                </div>
                <div className={styles.menuItem}>
                  <Input color="white" width="100%" placeholder="amount" labelRight={"WETH"} css={{ $$inputColor: "#525257" }}/>
                </div>
              </div>
              <div className={styles.buttonContainer}>
                <Button style={sellButton}>Sell</Button>
                <Button style={buyButton}>Buy</Button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.halfLine}>Line 3 (1st half)</div>
          <div className={styles.halfLine}>Line 3 (2nd half)</div>
        </div>
      </div>
    </div>
  );
}
