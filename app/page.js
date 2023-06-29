'use client';

import './OrderTable.css';
import './MyOrderTable.css';
import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css'
import { Button } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { ethers } from 'ethers';
import Web3 from 'web3';

export default function Home() {
  const dexBookAbi = require("../contracts/DexBook.json").abi;
  const dexBookAddress = "0x615cfd913dCB3260390C25046c9AC1d8aD857326";
  const tokenAabi = require("../contracts/USDC.json").abi;
  const tokenBabi = require("../contracts/WETH.json").abi;
  const rpcUrl = "https://erpc.apothem.network"

  const [isMarketClicked, setMarketClicked] = useState(false);
  const [isLimitClicked, setLimitClicked] = useState(true);
  const [isBuyOrdersClicked, setBuyOrdersClicked] = useState(false);
  const [isSellOrdersClicked, setSellOrdersClicked] = useState(true);

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

  const buyColor = "green"
  const sellColor = "red"

  const buyButton = {width: "100%", margin: "0.5em", color: buyColor, backgroundColor: "#525257", fontFamily: 'Montserrat, sans-serif', maxHeight: "100%"}
  const sellButton = {width: "100%", margin: "0.5em", color: sellColor, backgroundColor: "#525257", fontFamily: 'Montserrat, sans-serif', maxHeight: "100%"}
  const switchButton = {marginLeft: "0.5em", fontFamily: 'Montserrat, sans-serif'}

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

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function to4decimals(number) {
    return number.toFixed(4);
  }

  async function placeBuyLimitOrder() {
    const buyAmountWithDecimalsFactor = BigInt(buyAmount * tokenADecimalsFactor);
    const buyPriceWithPrecision = BigInt(pricePrecision / buyPrice);
    const tokenBamountWithDecimalsFactor = await dexBookRead.tokenAToTokenB(buyAmountWithDecimalsFactor, buyPriceWithPrecision);

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
    let tx = await tokenBContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(tokenBamountWithDecimalsFactor));
    await sleep(2000);

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookContractWrite.placeBuyLimitOrder(buyAmountWithDecimalsFactor, buyPriceWithPrecision, [0], [0]);
    await sleep(2000);
  }

  async function placeSellLimitOrder() {
    const sellAmountWithDecimalsFactor = BigInt(sellAmount * sellPrice * tokenBDecimalsFactor);
    const sellPriceWithPrecision = BigInt(sellPrice * pricePrecision);
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
    const buyAmountWithDecimalsFactor = buyAmount * tokenBDecimalsFactor;

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
    let tx = await tokenBContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(buyAmountWithDecimalsFactor));
    await sleep(5000);

    const dexBookWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookWrite.placeBuyMarketOrder(buyAmountWithDecimalsFactor);
    await sleep(2000);
  }

  async function placeSellMarketOrder() {
    const buyAmountWithDecimalsFactor = buyAmount * tokenBDecimalsFactor;

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
    let tx = await tokenBContractWrite.approve(dexBookAddress, await dexBookRead.amountPlusFee(buyAmountWithDecimalsFactor));
    await sleep(2000);

    const dexBookWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    tx = await dexBookWrite.placeBuyMarketOrder(buyAmountWithDecimalsFactor);
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
              ? userSellOrdersComputed[order.maker].push({id: order.id, price: price, amount: amount, total: tokenBAmount})
              : userSellOrdersComputed[order.maker] = [{id: order.id, price: price, amount: amount, total: tokenBAmount}];
          }
          sellOrdersComputed.push({price: price, amount: accumulatedAmount, total: accumulatedCost});
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
              ? userBuyOrdersComputed[order.maker].push({id: order.id, price: price, amount: amount, total: cost})
              : userBuyOrdersComputed[order.maker] = [{id: order.id, price: price, amount: amount, total: cost}];
          }
          buyOrdersComputed.push({price: price, amount: accumulatedAmount, total: accumulatedCost});
        }
        setBuyOrders(buyOrdersComputed);
        setUserBuyOrders(userBuyOrdersComputed);
      }
      if (buyOrders.length == 0 && sellOrders.length == 0) bootstrapDexBook();
  }, [buyOrders, account]);

  return (
    <div className={styles.myApp}>
      <nav className={styles.navbar}>
        <h1>DexBook</h1>
        {account 
          ? (<Button animated="false" style={{position: "absolute", right: "0.5em", top: "0.5em", backgroundColor: "#282828"}}>{account.slice(0, 6)}...{account.slice(-4)}</Button>)
          : (<Button style={{position: "absolute", right: "0.5em", top: "0.5em", backgroundColor: "#282828"}} onClick={connectToMetaMask}>Connect Wallet</Button>)}
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
                  <td style={{color:sellColor}}>{to4decimals(order.price)}</td>
                  <td>{to4decimals(order.amount)}</td>
                  <td>{to4decimals(order.total)}</td>
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
                  <th>Price ({tokenBSymbol})</th>
                  <th>Amount ({tokenASymbol})</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {buyOrders.map((order) => (
                  <tr key={order.price}>
                    <td style={{color:buyColor}}>{to4decimals(order.price)}</td>
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
                <Input onChange={(e) => setSellPrice(e.target.value)} color="white" width="100%" disabled={isMarketClicked} labelRight={tokenBSymbol} placeholder="price" css={isLimitClicked ? { $$inputColor: "#525257"} : { $$inputColor: "grey"}}/>
              </div>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setBuyPrice(e.target.value)} color="white" width="100%" disabled={isMarketClicked} labelRight={tokenBSymbol} placeholder="price" css={isLimitClicked ? { $$inputColor: "#525257"} : { $$inputColor: "grey"}}/>
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setSellAmount(e.target.value)} color="white" width="100%" placeholder="amount" labelRight={isLimitClicked? tokenASymbol : tokenBSymbol} css={{ $$inputColor: "#525257" }}/>
              </div>
              <div className={styles.menuItem}>
                <Input onChange={(e) => setBuyAmount(e.target.value)} color="white" width="100%" placeholder="amount" labelRight={tokenBSymbol} css={{ $$inputColor: "#525257" }}/>
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <Button onClick={isLimitClicked? placeSellLimitOrder : placeSellMarketOrder} style={sellButton}>Sell</Button>
              <Button onClick={isLimitClicked? placeBuyLimitOrder : placeBuyMarketOrder} style={buyButton}>Buy</Button>
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
              <Button size="xs" style={isSellOrdersClicked ? { ...switchButton, backgroundColor: 'red' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleSellOrdersClick}>Sell Orders</Button>          
              <Button size="xs" style={isBuyOrdersClicked ? { ...switchButton, backgroundColor: 'green' } : { ...switchButton, backgroundColor: '#525257' }} onClick={handleBuyOrdersClick}>Buy Orders</Button>    
            </div>
            <table className="my-order-table">
              <thead>
                <tr>
                  <th>Price ({tokenBSymbol})</th>
                  <th>Amount ({tokenASymbol})</th>
                  <th>Amount ({tokenBSymbol})</th>
                </tr>
              </thead>
              <tbody>
                {account && isSellOrdersClicked && userSellOrders[account] && userSellOrders[account].length > 0 && userSellOrders[account].map((order) => (
                  <tr key={order.price.toString() + order.id.toString()}>
                    <td style={{color: sellColor}}>{to4decimals(order.price)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
                {account && isBuyOrdersClicked && userBuyOrders[account] && userBuyOrders[account].length > 0 && userBuyOrders[account].map((order) => (
                  <tr key={order.price.toString() + order.id.toString()}>
                    <td style={{color: buyColor}}>{to4decimals(order.price)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
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
