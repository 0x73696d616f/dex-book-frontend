'use client';

import './OrderTable.css';
import './MyOrderTable.css';
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import styles from './page.module.css'
import { Button } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { ethers } from 'ethers';
import Web3 from 'web3';

export default function Home() {
  const dexBookAbi = require("../contracts/DexBook.json").abi;
  const dexBookAddress = "0xafc548695E9B4CE079693C68Dc16b0FfA29579C8";
  const tokenAabi = require("../contracts/USDC.json").abi;
  const tokenBabi = require("../contracts/WETH.json").abi;
  const rpcUrl = "https://erpc.apothem.network"

  const [isMarketClicked, setMarketClicked] = useState(false);
  const [isLimitClicked, setLimitClicked] = useState(true);
  const [isBuyOrdersClicked, setBuyOrdersClicked] = useState(true);
  const [isSellOrdersClicked, setSellOrdersClicked] = useState(false);

  const [dexBookRead, setDexBookRead] = useState(null);
  const [sellOrders, setSellOrders] = useState([]);
  const [buyOrders, setBuyOrders] = useState([]);
  const [userSellOrders, setUserSellOrders] = useState({});
  const [userBuyOrders, setUserBuyOrders] = useState({});
  const [tokenA, setTokenA] = useState(0);
  const [tokenB, setTokenB] = useState(0);
  const [tokenASymbol, setTokenASymbol] = useState("");
  const [tokenBSymbol, setTokenBSymbol] = useState("");
  const [tokenADecimalsFactor, setTokenADecimalsFactor] = useState(0);
  const [tokenBDecimalsFactor, setTokenBDecimalsFactor] = useState(0);
  const [pricePrecision, setPricePrecision] = useState(1e18);
  const [account, setAccount] = useState("");

  const [buyPrice, setBuyPrice] = useState(0);
  const [buyAmount, setBuyAmount] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellAmount, setSellAmount] = useState(0);

  const [price, setPrice] = useState(0);
  const [priceColor, setPriceColor] = useState("grey");
  const [marketOrders, setMarketOrders] = useState([]);

  const [selectedRow, setSelectedRow] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPrice, setPopupPrice] = useState(0);
  const [popupAmount, setPopupAmount] = useState(0);

  const buyColor = "green"
  const sellColor = "red"

  const buyButton = { width: "100%", margin: "0.5em", color: buyColor, backgroundColor: "#525257", fontFamily: 'Montserrat, sans-serif', maxHeight: "100%" }
  const sellButton = { width: "100%", margin: "0.5em", color: sellColor, backgroundColor: "#525257", fontFamily: 'Montserrat, sans-serif', maxHeight: "100%" }
  const switchButton = { marginLeft: "0.5em", fontFamily: 'Montserrat, sans-serif' }

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
    setShowPopup(false);
    setSelectedRow(null);
  };

  const handleSellOrdersClick = () => {
    setBuyOrdersClicked(false);
    setSellOrdersClicked(true);
    setShowPopup(false);
    setSelectedRow(null);
  };

  const handleRowClick = (order) => {
    setSelectedRow(order);
    setShowPopup(true);
    setPopupPrice(order.price);
    setPopupAmount(order.amount);
  };

  const handleSave = async () => {
    if (isBuyOrdersClicked) {
      const oldOrder = selectedRow;
      const oldBuyAmountWithDecimalsFactor = BigInt(Math.round(oldOrder.amount * tokenADecimalsFactor));
      const oldBuyPriceWithPrecision = BigInt(Math.round(pricePrecision / oldOrder.price));
      const oldTokenBamountWithDecimalsFactor = BigInt(await dexBookRead.tokenAToTokenB(oldBuyAmountWithDecimalsFactor, oldBuyPriceWithPrecision));

      const newOrder = {price: popupPrice, amount: popupAmount };
      const newBuyAmountWithDecimalsFactor = BigInt(Math.round(newOrder.amount * tokenADecimalsFactor));
      const newBuyPriceWithPrecision = BigInt(Math.round(pricePrecision / newOrder.price));
      const newTokenBamountWithDecimalsFactor = BigInt(await dexBookRead.tokenAToTokenB(newBuyAmountWithDecimalsFactor, newBuyPriceWithPrecision));

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

      if (newTokenBamountWithDecimalsFactor > oldTokenBamountWithDecimalsFactor) {
        const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
        const tx = await tokenBContractWrite.approve(dexBookAddress, BigInt(await dexBookRead.amountPlusFee(newTokenBamountWithDecimalsFactor - oldTokenBamountWithDecimalsFactor)));
        await sleep(5000);
      }

      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      const tx = await dexBookContractWrite.modifyBuyLimitOrder(oldOrder.id, oldBuyPriceWithPrecision, newBuyPriceWithPrecision, newBuyAmountWithDecimalsFactor, [0], [0]);
      await sleep(2000);
    } else if (isSellOrdersClicked){
      const oldOrder = selectedRow;
      const oldSellAmountWithDecimalsFactor = BigInt(Math.round(oldOrder.amount * oldOrder.price * tokenBDecimalsFactor));
      const oldSellPriceWithPrecision = BigInt(Math.round(oldOrder.price * pricePrecision));
      const oldTokenAamountWithDecimalsFactor = BigInt(await dexBookRead.tokenBToTokenA(oldSellAmountWithDecimalsFactor, oldSellPriceWithPrecision));
  
      const newOrder = {price: popupPrice, amount: popupAmount };
      const newSellAmountWithDecimalsFactor = BigInt(Math.round(newOrder.amount * newOrder.price * tokenBDecimalsFactor));
      const newSellPriceWithPrecision = BigInt(Math.round(newOrder.price * pricePrecision));
      const newTokenAamountWithDecimalsFactor = BigInt(await dexBookRead.tokenBToTokenA(newSellAmountWithDecimalsFactor, newSellPriceWithPrecision));

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
  
      if (newTokenAamountWithDecimalsFactor > oldTokenAamountWithDecimalsFactor) {
        const tokenAContractWrite = new ethers.Contract(tokenA.address, tokenAabi, signer);
        const tx = await tokenAContractWrite.approve(dexBookAddress, BigInt(await dexBookRead.amountPlusFee(newTokenAamountWithDecimalsFactor - oldTokenAamountWithDecimalsFactor)));
        await sleep(5000);
      }
  
      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      const tx = await dexBookContractWrite.modifySellLimitOrder(oldOrder.id, oldSellPriceWithPrecision, newSellPriceWithPrecision, newSellAmountWithDecimalsFactor, [0], [0]);
      await sleep(2000);
    }
    setSelectedRow(null);
    setShowPopup(false);
  };

  const handleCancel = () => {
    setSelectedRow(null);
    setShowPopup(false);
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function to4decimals(number) {
    return number.toFixed(4);
  }

  async function placeBuyLimitOrder() {
    const buyAmountWithDecimalsFactor = BigInt(Math.round(buyAmount * tokenADecimalsFactor));
    const buyPriceWithPrecision = BigInt(Math.round(pricePrecision / buyPrice));
    const tokenBamountWithDecimalsFactor = await dexBookRead.tokenAToTokenB(buyAmountWithDecimalsFactor, buyPriceWithPrecision);

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
    let tx = await tokenBContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(tokenBamountWithDecimalsFactor));
    await sleep(5000);

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookContractWrite.placeBuyLimitOrder(buyAmountWithDecimalsFactor, buyPriceWithPrecision, [0], [0]);
    await sleep(2000);
  }

  async function placeSellLimitOrder() {
    const sellAmountWithDecimalsFactor = BigInt(Math.round(sellAmount * sellPrice * tokenBDecimalsFactor));
    const sellPriceWithPrecision = BigInt(Math.round(sellPrice * pricePrecision));
    const tokenAamountWithDecimalsFactor = await dexBookRead.tokenBToTokenA(sellAmountWithDecimalsFactor, sellPriceWithPrecision);

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenAContractWrite = new ethers.Contract(tokenA.address, tokenAabi, signer);
    let tx = await tokenAContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(tokenAamountWithDecimalsFactor));
    await sleep(5000);

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookContractWrite.placeSellLimitOrder(sellAmountWithDecimalsFactor, sellPriceWithPrecision, [0], [0]);
    await sleep(2000);
  }

  async function placeBuyMarketOrder() {
    const buyAmountWithDecimalsFactor = BigInt(Math.round(buyAmount * tokenBDecimalsFactor));

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
    let tx = await tokenBContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(buyAmountWithDecimalsFactor));
    await sleep(5000);

    const dexBookWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookWrite.placeBuyMarketOrder(buyAmountWithDecimalsFactor);
    await sleep(2000);
  }

  async function placeSellMarketOrder() {
    const sellAmountWithDecimalsFactor = BigInt(Math.round(sellAmount * tokenADecimalsFactor));

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenAContractWrite = new ethers.Contract(tokenA.address, tokenBabi, signer);
    let tx = await tokenAContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(sellAmountWithDecimalsFactor));
    await sleep(5000);

    const dexBookWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookWrite.placeSellMarketOrder(sellAmountWithDecimalsFactor);
    await sleep(2000);
  }


  async function connectToMetaMask() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          console.error('No accounts found in MetaMask');
        }
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.error('MetaMask extension not detected');
    }
  }

  useEffect(() => {
    const bootstrapDexBook = async () => {
      const dexBookContractRead = new ethers.Contract(dexBookAddress, dexBookAbi, new ethers.providers.JsonRpcProvider(rpcUrl));
      setDexBookRead(dexBookContractRead);
      const pricePrecisionRead = await dexBookContractRead.pricePrecision();
      setPricePrecision(pricePrecisionRead);
      const tokenARead = new ethers.Contract(await dexBookContractRead.tokenA(), tokenAabi, new ethers.providers.JsonRpcProvider(rpcUrl));
      setTokenA(tokenARead);
      const tokenBRead = new ethers.Contract(await dexBookContractRead.tokenB(), tokenBabi, new ethers.providers.JsonRpcProvider(rpcUrl));
      setTokenB(tokenBRead);
      const tokenADecimalsFactorRead = 10 ** await tokenARead.decimals();
      setTokenADecimalsFactor(tokenADecimalsFactorRead);
      const tokenBDecimalsFactorRead = 10 ** await tokenBRead.decimals();
      setTokenBDecimalsFactor(tokenBDecimalsFactorRead);
      setTokenASymbol(await tokenARead.symbol());
      setTokenBSymbol(await tokenBRead.symbol());

      const sellOrdersRead = await dexBookContractRead.sellOrdersAndPrices();
      let sellOrdersComputed = [];
      let userSellOrdersComputed = {};
      for (const priceBracket of sellOrdersRead) {
        let accumulatedAmount = 0;
        let accumulatedCost = 0;
        const price = priceBracket.price / pricePrecisionRead;
        for (const order of priceBracket.orders) {
          const tokenBAmount = order.amount / tokenBDecimalsFactorRead;
          accumulatedCost += tokenBAmount;
          const amount = tokenBAmount / price;
          accumulatedAmount += amount;
          userSellOrdersComputed[order.maker]
            ? userSellOrdersComputed[order.maker].push({ id: order.id, price: price, amount: amount, total: tokenBAmount })
            : userSellOrdersComputed[order.maker] = [{ id: order.id, price: price, amount: amount, total: tokenBAmount }];
        }
        sellOrdersComputed.push({ price: price, amount: accumulatedAmount, total: accumulatedCost });
      }
      setSellOrders(sellOrdersComputed);
      setUserSellOrders(userSellOrdersComputed);

      const buyOrdersRead = await dexBookContractRead.buyOrdersAndPrices();
      let buyOrdersComputed = [];
      let userBuyOrdersComputed = {};
      for (const priceBracket of buyOrdersRead) {
        let accumulatedAmount = 0;
        let accumulatedCost = 0;
        const price = pricePrecisionRead / priceBracket.price;
        for (const order of priceBracket.orders) {
          const amount = order.amount / tokenADecimalsFactorRead;
          const cost = amount * price;
          accumulatedAmount += amount;
          accumulatedCost += cost;

          userBuyOrdersComputed[order.maker]
            ? userBuyOrdersComputed[order.maker].push({ id: order.id, price: price, amount: amount, total: cost })
            : userBuyOrdersComputed[order.maker] = [{ id: order.id, price: price, amount: amount, total: cost }];
        }
        buyOrdersComputed.push({ price: price, amount: accumulatedAmount, total: accumulatedCost });
      }
      setBuyOrders(buyOrdersComputed);
      setUserBuyOrders(userBuyOrdersComputed);

      const buyEvents = await dexBookContractRead.queryFilter("BuyMarketOrderFilled");
      const sellEvents = await dexBookContractRead.queryFilter("SellMarketOrderFilled");
      setMarketOrders([...buyEvents, ...sellEvents].sort((a, b) => a.timestamp - b.timestamp));

      const mostRecentBuyPrice = buyEvents.length == 0 ? 0 : buyEvents[buyEvents.length - 1].args.price / pricePrecisionRead;
      const mostRecentSellPrice = sellEvents.length == 0 ? 0 : sellEvents[sellEvents.length - 1].args.price / pricePrecisionRead;
      const isSellTheMostRecentPrice = sellEvents.length > 0 && (buyEvents.length === 0 || sellEvents[sellEvents.length - 1].blockNumber > buyEvents[buyEvents.length - 1].blockNumber);
      setPrice(isSellTheMostRecentPrice ? mostRecentSellPrice : mostRecentBuyPrice);
      setPriceColor(isSellTheMostRecentPrice ? sellColor : buyColor);
    }
    if (buyOrders.length == 0 && sellOrders.length == 0) bootstrapDexBook();
  }, [buyOrders, account, showPopup]);

  return (
    <div className={styles.myApp}>
      <nav className={styles.navbar}>
        <h1>DexBook</h1>
        {account
          ? (<Button animated="false" style={{ position: "absolute", right: "0.5em", top: "0.5em", backgroundColor: "#282828" }}>{account.slice(0, 6)}...{account.slice(-4)}</Button>)
          : (<Button style={{ position: "absolute", right: "0.5em", top: "0.5em", backgroundColor: "#282828" }} onClick={connectToMetaMask}>Connect Wallet</Button>)}
      </nav>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.fortyFivePercentLine}>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Price ({tokenBSymbol})</th>
                  <th>Amount ({tokenASymbol})</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {sellOrders && sellOrders.length > 0 && sellOrders.map((order) => (
                  <tr key={order.price}>
                    <td style={{ color: sellColor }}>{to4decimals(order.price)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.tenPercentLine}>
            <div style={{ color: priceColor }}>
              {price?.toFixed(4)}
            </div>
          </div>
          <div className={styles.fortyFivePercentLine}>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Price ({tokenBSymbol})</th>
                  <th>Amount ({tokenASymbol})</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {buyOrders.map((order) => (
                  <tr key={order.price}>
                    <td style={{ color: buyColor }}>{to4decimals(order.price)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.sixtyPercentLine}>Line 2 (60%)</div>
          <div className={styles.fortyPercentLine}>
            <div className={styles.switchContainer}>
              <Button size="xs" style={isLimitClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleLimitClick}>Limit</Button>
              <Button size="xs" style={isMarketClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleMarketClick}>Market</Button>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setBuyPrice(e.target.value)} color="white" width="100%" disabled={isMarketClicked} labelRight={tokenBSymbol} labelPlaceholder="price" css={isLimitClicked ? { $$inputColor: "#525257" } : { $$inputColor: "grey" }} />
              </div>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setSellPrice(e.target.value)} color="white" width="100%" disabled={isMarketClicked} labelRight={tokenBSymbol} labelPlaceholder="price" css={isLimitClicked ? { $$inputColor: "#525257" } : { $$inputColor: "grey" }} />
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setBuyAmount(e.target.value)} color="white" width="100%" labelPlaceholder="amount" labelRight={isLimitClicked ? tokenASymbol : tokenBSymbol} css={{ $$inputColor: "#525257" }} />

              </div>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setSellAmount(e.target.value)} color="white" width="100%" labelPlaceholder="amount" labelRight={tokenASymbol} css={{ $$inputColor: "#525257" }} />
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <Button onClick={isLimitClicked ? placeBuyLimitOrder : placeBuyMarketOrder} style={buyButton}>Buy ETH</Button>
              <Button onClick={isLimitClicked ? placeSellLimitOrder : placeSellMarketOrder} style={sellButton}>Sell ETH</Button>
            </div>
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.halfLine}>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Pair ({tokenBSymbol})</th>
                  <th>Price ({tokenASymbol})</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {pairs && pairs.length && pairs.map((pair) => (
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
                <Button size="xs" style={isBuyOrdersClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleBuyOrdersClick}>Buy Orders</Button>
                <Button size="xs" style={isSellOrdersClicked ? { ...switchButton, backgroundColor: 'red' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleSellOrdersClick}>Sell Orders</Button>
              </div>

              {!showPopup && (<table className="my-order-table">
                <thead>
                  <tr>
                    <th>Price ({tokenBSymbol})</th>
                    <th>Amount ({tokenASymbol})</th>
                    <th>Total ({tokenBSymbol})</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {account && isSellOrdersClicked && userSellOrders[account] && userSellOrders[account].length > 0 && userSellOrders[account].map((order) => (
                    <tr key={order.price.toString() + order.id.toString()} onClick={() => handleRowClick(order)}>
                      <td style={{ color: sellColor }}>{to4decimals(order.price)}</td>
                      <td>{to4decimals(order.amount)}</td>
                      <td>{to4decimals(order.total)} <FontAwesomeIcon icon={faPenToSquare} style={{position: "absolute", right: "0"}}/></td>
                    </tr>
                  ))}
                  {account && isBuyOrdersClicked && userBuyOrders[account] && userBuyOrders[account].length > 0 && userBuyOrders[account].map((order) => (
                    <tr key={order.price.toString() + order.id.toString()} onClick={() => handleRowClick(order)}>
                      <td style={{ color: buyColor }}>{to4decimals(order.price)}</td>
                      <td>{to4decimals(order.amount)}</td>
                      <td>{to4decimals(order.total)} <FontAwesomeIcon icon={faPenToSquare} style={{position: "absolute", right: "0"}}/></td>      
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            {showPopup && selectedRow && (
              <div className="popup">
                <Input width="100%" style={{color: "white"}} labelRight={tokenBSymbol} placeHolder={selectedRow.price} label="price" css={{ $$inputColor: "#525257", marginBottom: "1em" }} value={popupPrice} onChange={(e) => setPopupPrice(e.target.value )} />
                <Input width="100%" style={{color: "white"}} labelRight={tokenASymbol} placeHolder={selectedRow.amount} label="amount" css={{ $$inputColor: "#525257", marginBottom: "1em"}} value={popupAmount} onChange={(e) => setPopupAmount(e.target.value)} />
                <div className="popup-button-container">
                  <Button size="sm" style={{ backgroundColor: "#525257", marginRight: "0.5em" }} onClick={handleSave}>Confirm</Button>
                  <Button size="sm" style={{ backgroundColor: "#525257", marginLeft: "0.5em" }} onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
