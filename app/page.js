'use client';

import './OrderTable.css';
import './MyOrderTable.css';
import React, { useState } from 'react';
import styles from './page.module.css'
import { Button } from "@nextui-org/react";
import { Input } from "@nextui-org/react";

export default function Home() {
  const [isMarketClicked, setMarketClicked] = useState(false);
  const [isLimitClicked, setLimitClicked] = useState(true);
  const [isBuyOrdersClicked, setBuyOrdersClicked] = useState(false);
  const [isSellOrdersClicked, setSellOrdersClicked] = useState(true);

  const buyColor = "green"
  const sellColor = "red"

  const buyButton = {width: "100%", margin: "0.5em", color: buyColor, backgroundColor: "#525257", fontFamily: 'Montserrat, sans-serif'}
  const sellButton = {width: "100%", margin: "0.5em", color: sellColor, backgroundColor: "#525257", fontFamily: 'Montserrat, sans-serif'}
  const switchButton = {marginLeft: "0.5em", fontFamily: 'Montserrat, sans-serif'}

  const orders = [
    { id: 1, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 2, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 3, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    
  ];
  const buyOrders = [
    { id: 1, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 2, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 3, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
  ];

  const sellOrders = [
    { id: 1, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 2, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 3, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
    { id: 4, price: 1750.20, amount: 2.4532, total: 3500.30232 },
  ];

  const pairs = [
    { id: 1, pair: "WETH/USDC", price: 1750.20, change: 0.05 },
    { id: 2, pair: "WETH/USDC", price: 1750.20, change: 0.05 },
    { id: 3, pair: "WETH/USDC", price: 1750.20, change: 0.05 },
  ];

  const handleMarketClick = () => {
    setMarketClicked(true);
    setLimitClicked(false);
  };

  const handleLimitClick = () => {
    setMarketClicked(false);
    setLimitClicked(true);
  };

  const handleBuyOrdersClick = () => {
    setBuyOrdersClicked(true);
    setSellOrdersClicked(false);
  };

  const handleSellOrdersClick = () => {
    setBuyOrdersClicked(false);
    setSellOrdersClicked(true);
  };

  return (
    <div className={styles.myApp}>
      <nav className={styles.navbar}>
        <h1>DexBook</h1>
        <Button hover style={{position: "absolute", right: "0.5em", top: "0.5em", backgroundColor: "#282828"}}>Connect Wallet</Button>
      </nav>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.fortyFivePercentLine}>
          <table className="order-table">
            <thead>
              <tr>
                <th>Price (USDC)</th>
                <th>Amount (WETH)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{color:sellColor}}>{order.price}</td>
                  <td>{order.amount}</td>
                  <td>{order.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className={styles.tenPercentLine}>
            <div style={{color: buyColor}}>
              1750.20
            </div>
          </div>
          <div className={styles.fortyFivePercentLine}>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Price (USDC)</th>
                  <th>Amount (WETH)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{color:buyColor}}>{order.price}</td>
                    <td>{order.amount}</td>
                    <td>{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className={styles.halfLine}>
          <table className="order-table">
              <thead>
                <tr>
                  <th>Pair (USDC)</th>
                  <th>Price (WETH)</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((pair) => (
                  <tr key={pair.id}>
                    <td>{pair.pair}</td>
                    <td>{pair.price}</td>
                    <td>{pair.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.halfLine}>
            <div className={styles.myOrdersSwitchContainer}>
              <Button size="xs" style={isSellOrdersClicked ? { ...switchButton, backgroundColor: 'red' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleSellOrdersClick}>Sell Orders</Button>          
              <Button size="xs" style={isBuyOrdersClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleBuyOrdersClick}>Buy Orders</Button>    
            </div>
            <table className="my-order-table">
              <thead>
                <tr>
                  <th>Price (USDC)</th>
                  <th>Amount (WETH)</th>
                  <th>Amount (USDC)</th>
                </tr>
              </thead>
              <tbody>
                {(isSellOrdersClicked ? sellOrders : buyOrders).map((order) => (
                  <tr key={order.id}>
                    <td style={{color:isBuyOrdersClicked ? buyColor : sellColor}}>{order.price}</td>
                    <td>{order.amount}</td>
                    <td>{order.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
