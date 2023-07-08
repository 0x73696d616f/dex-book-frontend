'use client';

import './OrderTable.css';
import './MyOrderTable.css';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
const PriceChart = dynamic(() => import('./priceChart'), { ssr: false });
import PriceInput from './PriceInput';
import AmountInput from './AmountInput';
import BuySellButton from './BuySellButton';
import LimitMarketButton from './LimitMarketButton';
import NavbarButton from './NavbarButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import moment from 'moment';


import styles from './page.module.css'
import { Button } from "@nextui-org/react";
import { Input } from "@nextui-org/react";
import { ethers } from 'ethers';
import Web3 from 'web3';

export default function Home() {
  const dexBookAbi = require("../contracts/DexBook.json").abi;
  const dexBookAddress = "0x63bEfAA79c02bA13DC7568a8aa1Ed8e94388a0A9";
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
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);

  const [selectedRow, setSelectedRow] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPrice, setPopupPrice] = useState(0);
  const [popupAmount, setPopupAmount] = useState(0);

  const buyColor = "green"
  const sellColor = "red"

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

      const newOrder = { price: popupPrice, amount: popupAmount };
      const newBuyAmountWithDecimalsFactor = BigInt(Math.round(newOrder.amount * tokenADecimalsFactor));
      const newBuyPriceWithPrecision = BigInt(Math.round(pricePrecision / newOrder.price));
      const newTokenBamountWithDecimalsFactor = BigInt(await dexBookRead.tokenAToTokenB(newBuyAmountWithDecimalsFactor, newBuyPriceWithPrecision));

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

      if (newTokenBamountWithDecimalsFactor > oldTokenBamountWithDecimalsFactor) {
        await approveTokenB(signer, newTokenBamountWithDecimalsFactor - oldTokenBamountWithDecimalsFactor);
      }

      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      await dexBookContractWrite.modifyBuyLimitOrder(oldOrder.id, oldBuyPriceWithPrecision, newBuyPriceWithPrecision, newBuyAmountWithDecimalsFactor, [0], [0]);
    } else if (isSellOrdersClicked) {
      const oldOrder = selectedRow;
      const oldSellAmountWithDecimalsFactor = BigInt(Math.round(oldOrder.amount * oldOrder.price * tokenBDecimalsFactor));
      const oldSellPriceWithPrecision = BigInt(Math.round(oldOrder.price * pricePrecision));
      const oldTokenAamountWithDecimalsFactor = BigInt(await dexBookRead.tokenBToTokenA(oldSellAmountWithDecimalsFactor, oldSellPriceWithPrecision));

      const newOrder = { price: popupPrice, amount: popupAmount };
      const newSellAmountWithDecimalsFactor = BigInt(Math.round(newOrder.amount * newOrder.price * tokenBDecimalsFactor));
      const newSellPriceWithPrecision = BigInt(Math.round(newOrder.price * pricePrecision));
      const newTokenAamountWithDecimalsFactor = BigInt(await dexBookRead.tokenBToTokenA(newSellAmountWithDecimalsFactor, newSellPriceWithPrecision));

      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

      if (newTokenAamountWithDecimalsFactor > oldTokenAamountWithDecimalsFactor) {
        await approveTokenA(signer, newTokenAamountWithDecimalsFactor - oldTokenAamountWithDecimalsFactor)
      }

      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      await dexBookContractWrite.modifySellLimitOrder(oldOrder.id, oldSellPriceWithPrecision, newSellPriceWithPrecision, newSellAmountWithDecimalsFactor, [0], [0]);
    }
    setSelectedRow(null);
    setShowPopup(false);
  };

  const handleCancel = () => {
    setSelectedRow(null);
    setShowPopup(false);
  };

  const handleRemove = async () => {
    if (isBuyOrdersClicked) {
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      await dexBookContractWrite.removeBuyLimitOrder(selectedRow.id, BigInt(pricePrecision / selectedRow.price));
    } else if (isSellOrdersClicked) {
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      await dexBookContractWrite.removeSellLimitOrder(selectedRow.id, BigInt(selectedRow.price * pricePrecision));
    }
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

    await approveTokenB(signer, tokenBamountWithDecimalsFactor);

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    await dexBookContractWrite.placeBuyLimitOrder(buyAmountWithDecimalsFactor, buyPriceWithPrecision, [0], [0]);
  }

  async function placeSellLimitOrder() {
    const sellAmountWithDecimalsFactor = BigInt(Math.round(sellAmount * sellPrice * tokenBDecimalsFactor));
    const sellPriceWithPrecision = BigInt(Math.round(sellPrice * pricePrecision));
    const tokenAamountWithDecimalsFactor = await dexBookRead.tokenBToTokenA(sellAmountWithDecimalsFactor, sellPriceWithPrecision);

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    await approveTokenA(signer, tokenAamountWithDecimalsFactor);

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    await dexBookContractWrite.placeSellLimitOrder(sellAmountWithDecimalsFactor, sellPriceWithPrecision, [0], [0]);
  }

  async function placeBuyMarketOrder() {
    const buyAmountWithDecimalsFactor = BigInt(Math.round(buyAmount * tokenBDecimalsFactor));

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    await approveTokenB(signer, buyAmountWithDecimalsFactor);

    const dexBookWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    await dexBookWrite.placeBuyMarketOrder(buyAmountWithDecimalsFactor);
  }

  async function placeSellMarketOrder() {
    const sellAmountWithDecimalsFactor = BigInt(Math.round(sellAmount * tokenADecimalsFactor));

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    await approveTokenA(signer, sellAmountWithDecimalsFactor);

    const dexBookWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    await dexBookWrite.placeSellMarketOrder(sellAmountWithDecimalsFactor);
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

  async function approveTokenA(signer, amount) {
    const totalAmount = BigInt(await dexBookRead.amountPlusFee(BigInt(amount)));

    if (await tokenA.allowance(account, dexBookAddress) >= totalAmount) return;

    const tokenAContractWrite = new ethers.Contract(tokenA.address, tokenAabi, signer);
    await tokenAContractWrite.approve(dexBookAddress, totalAmount);
    await sleep(5000);
  }

  async function approveTokenB(signer, amount) {
    const totalAmount = BigInt(await dexBookRead.amountPlusFee(BigInt(amount)));

    if (await tokenB.allowance(account, dexBookAddress) >= totalAmount) return;

    const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
    await tokenBContractWrite.approve(dexBookAddress, totalAmount);
    await sleep(5000);
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
      const marketOrdersRead = [...buyEvents, ...sellEvents].sort((a, b) => a.args.timestamp - b.args.timestamp);

      const mostRecentBuyPrice = buyEvents.length == 0 ? 0 : buyEvents[buyEvents.length - 1].args.price / pricePrecisionRead;
      const mostRecentSellPrice = sellEvents.length == 0 ? 0 : sellEvents[sellEvents.length - 1].args.price / pricePrecisionRead;
      const isSellTheMostRecentPrice = sellEvents.length > 0 && (buyEvents.length === 0 || sellEvents[sellEvents.length - 1].blockNumber > buyEvents[buyEvents.length - 1].blockNumber);
      setPrice(isSellTheMostRecentPrice ? mostRecentSellPrice : mostRecentBuyPrice);
      setPriceColor(isSellTheMostRecentPrice ? sellColor : buyColor);

      const chartLabelsComputed = marketOrdersRead.map(order => moment(new Date(Number(order.args.timestamp) * 1000)).format("YYYY-MM-DD HH:mm:ss"));
      const chartDataComputed = marketOrdersRead.map(order => Number(order.args.price) / Number(pricePrecisionRead));
      setChartData(chartDataComputed);
      setChartLabels(chartLabelsComputed);

      dexBookContractRead.removeAllListeners();

      dexBookContractRead.on("BuyLimitOrderPlaced", async (orderId, price, maker, amount) => {
        const priceComputed = pricePrecisionRead / price;
        const amountComputed = amount / tokenADecimalsFactorRead;
        const totalComputed = amountComputed * priceComputed;
        const newBuyOrder = { id: orderId, price: priceComputed, amount: amountComputed, total: totalComputed };
        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => order.price.toFixed(4) === priceComputed.toFixed(4));
          if (index === -1) {
            return [...prevBuyOrders, newBuyOrder].sort((a, b) => b.price - a.price)
          }
          prevBuyOrders[index].amount += amountComputed;
          prevBuyOrders[index].total += totalComputed;
          return [...prevBuyOrders];

        });
        setUserBuyOrders(userBuyOrders => {
          let newUserBuyOrders = userBuyOrders[maker];
          if (!newUserBuyOrders) newUserBuyOrders = [];
          newUserBuyOrders.push(newBuyOrder);
          newUserBuyOrders.sort((a, b) => b.price - a.price);
          userBuyOrders[maker] = newUserBuyOrders;
          return userBuyOrders
        });
      });

      dexBookContractRead.on("SellLimitOrderPlaced", async (orderId, price, maker, amount) => {
        const totalComputed = amount / tokenBDecimalsFactorRead;
        const priceComputed = price / pricePrecisionRead;
        const amountComputed = totalComputed / priceComputed;
        const newSellOrder = { id: orderId, price: priceComputed, amount: amountComputed, total: totalComputed };
        setSellOrders(sellOrders => {
          const index = sellOrders.findIndex(order => order.price.toFixed(4) === priceComputed.toFixed(4));
          if (index === -1) {
            return [...sellOrders, newSellOrder].sort((a, b) => a.price - b.price)
          }

          sellOrders[index].amount += amountComputed;
          sellOrders[index].total += totalComputed;
          return [...sellOrders];
        });
        setUserSellOrders(userSellOrders => {
          let newUserSellOrders = userSellOrders[maker];
          if (!newUserSellOrders) newUserSellOrders = [];
          newUserSellOrders.push(newSellOrder);
          newUserSellOrders.sort((a, b) => a.price - b.price);
          userSellOrders[maker] = newUserSellOrders;
          return userSellOrders
        });
      });

      dexBookContractRead.on("BuyMarketOrderFilled", async (timestamp, price, maker, amount) => {
        const newPrice = price / pricePrecisionRead;
        const newTimestamp = moment(new Date(Number(timestamp) * 1000)).format("YYYY-MM-DD HH:mm:ss");
        setPrice(newPrice);
        setPriceColor(buyColor);
        setChartData(chartData => [...chartData, newPrice]);
        setChartLabels(chartLabels => [...chartLabels, newTimestamp]);
      });

      dexBookContractRead.on("SellMarketOrderFilled", async (timestamp, price, maker, amount) => {
        const newPrice = price / pricePrecisionRead;
        const newTimestamp = moment(new Date(Number(timestamp) * 1000)).format("YYYY-MM-DD HH:mm:ss");
        setPrice(newPrice);
        setPriceColor(sellColor);
        setChartData(chartData => [...chartData, newPrice]);
        setChartLabels(chartLabels => [...chartLabels, newTimestamp]);
      });

      dexBookContractRead.on("BuyLimitOrderFilled", async (orderId_, price, maker, amount) => {
        const priceComputed = pricePrecisionRead / price;
        const amountComputed = amount / tokenADecimalsFactorRead;
        const totalComputed = amountComputed * priceComputed;
        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => order.price.toFixed(4) === priceComputed.toFixed(4));
          const newAmount = prevBuyOrders[index].amount - amountComputed;
          if (newAmount.toFixed(4) <= 0) {
            prevBuyOrders.splice(index, 1);
          } else {
            prevBuyOrders[index].amount = newAmount;
            prevBuyOrders[index].total = prevBuyOrders[index].total - totalComputed;
          }
          return prevBuyOrders;
        });
        setUserBuyOrders(prevUserBuyOrders => {
          const index = prevUserBuyOrders[maker].findIndex(order => order.price.toFixed(4) == priceComputed.toFixed(4) && order.id === orderId_);
          const newAmount = prevUserBuyOrders[maker][index].amount - amountComputed;
          if (newAmount <= 0) {
            prevUserBuyOrders[maker].splice(index, 1);
          } else {
            prevUserBuyOrders[maker][index].amount = newAmount;
            prevUserBuyOrders[maker][index].total = prevUserBuyOrders[maker][index].total - totalComputed;
          }
          return prevUserBuyOrders
        });
      });

      dexBookContractRead.on("SellLimitOrderFilled", async (orderId_, price, maker, amount) => {
        const totalComputed = amount / tokenBDecimalsFactorRead;
        const priceComputed = price / pricePrecisionRead;
        const amountComputed = totalComputed / priceComputed;
        setSellOrders(prevSellOrders => {
          const index = prevSellOrders.findIndex(order => order.price.toFixed(4) === priceComputed.toFixed(4));
          const newAmount = prevSellOrders[index].amount - amountComputed;
          if (newAmount.toFixed(4) <= 0) {
            prevSellOrders.splice(index, 1);
          } else {
            prevSellOrders[index].amount = newAmount;
            prevSellOrders[index].total = prevSellOrders[index].total - totalComputed;
          }
          return prevSellOrders;
        });
        setUserSellOrders(prevUserSellOrders => {
          const index = prevUserSellOrders[maker].findIndex(order => order.price.toFixed(4) == priceComputed.toFixed(4) && order.id === orderId_);
          const newAmount = prevUserSellOrders[maker][index].amount - amountComputed;
          if (newAmount.toFixed(4) <= 0) {
            prevUserSellOrders[maker].splice(index, 1);
          } else {
            prevUserSellOrders[maker][index].amount = newAmount;
            prevUserSellOrders[maker][index].total = prevUserSellOrders[maker][index].total - totalComputed;
          }
          return prevUserSellOrders
        });
      });

      dexBookContractRead.on("BuyLimitOrderCancelled", async (orderId_, price, maker, amount) => {
        const priceComputed = pricePrecisionRead / price;
        const amountComputed = amount / tokenADecimalsFactorRead;
        const totalComputed = amountComputed * priceComputed;
        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => order.price.toFixed(4) === priceComputed.toFixed(4));
          const newAmount = prevBuyOrders[index].amount - amountComputed;
          if (newAmount.toFixed(4) <= 0) {
            prevBuyOrders.splice(index, 1);
          } else {
            prevBuyOrders[index].amount = newAmount;
            prevBuyOrders[index].total = prevBuyOrders[index].total - totalComputed;
          }
          return [...prevBuyOrders];
        });
        setUserBuyOrders(prevUserBuyOrders => {
          const index = prevUserBuyOrders[maker].findIndex(order => order.price.toFixed(4) == priceComputed.toFixed(4) && order.id === orderId_);
          prevUserBuyOrders[maker].splice(index, 1);
          return prevUserBuyOrders
        });
      });

      dexBookContractRead.on("SellLimitOrderCancelled", async (orderId_, price, maker, amount) => {
        const totalComputed = amount / tokenBDecimalsFactorRead;
        const priceComputed = price / pricePrecisionRead;
        const amountComputed = totalComputed / priceComputed;
        setSellOrders(prevSellOrders => {
          const index = prevSellOrders.findIndex(order => order.price.toFixed(4) === priceComputed.toFixed(4));
          const newAmount = prevSellOrders[index].amount - amountComputed;
          if (newAmount.toFixed(4) <= 0) {
            prevSellOrders.splice(index, 1);
          } else {
            prevSellOrders[index].amount = newAmount;
            prevSellOrders[index].total = prevSellOrders[index].total - totalComputed;
          }
          return [...prevSellOrders];
        });
        setUserSellOrders(prevUserSellOrders => {
          const index = prevUserSellOrders[maker].findIndex(order => order.price.toFixed(4) == priceComputed.toFixed(4) && order.id === orderId_);
          prevUserSellOrders[maker].splice(index, 1);
          return prevUserSellOrders
        });
      });
    }

    bootstrapDexBook();
  }, []);

  return (
    <div className={styles.myApp}>
      <nav className={styles.navbar}>
        <NavbarButton onClick={() => {}} label={tokenASymbol + "faucet"} width="8%" marginLeft="0.5em"> </NavbarButton>
        <NavbarButton onClick={() => {}} label={tokenBSymbol + "faucet"} width="8%"> </NavbarButton>
        <h1>DexBook</h1>
        {account ? (
          <NavbarButton onClick={() => {}} label={account.slice(0, 6) + "..." + account.slice(-4)} width="16%">
          </NavbarButton>
        ) : (
          <NavbarButton onClick={connectToMetaMask} label="Connect Wallet" width="16%">
          </NavbarButton>
        )}
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
          <div className={styles.sixtyPercentLine}>
            <PriceChart chartLabels={chartLabels} chartData={chartData}></PriceChart>
          </div>
          <div className={styles.fortyPercentLine}>
            <div className={styles.switchContainer}>
              <LimitMarketButton isClicked={isLimitClicked} onClick={handleLimitClick} label="Limit" bgColor="green" width="15%"></LimitMarketButton>
              <LimitMarketButton isClicked={isMarketClicked} onClick={handleMarketClick} label="Market" bgColor="green" width="15%"></LimitMarketButton>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <PriceInput isLimitClicked={isLimitClicked} setPrice={setBuyPrice} isMarketClicked={isMarketClicked} tokenSymbol={tokenBSymbol} ></PriceInput>
              </div>
              <div className={styles.menuItem}>
                <PriceInput isLimitClicked={isLimitClicked} setPrice={setSellPrice} isMarketClicked={isMarketClicked} tokenSymbol={tokenBSymbol} ></PriceInput>
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <AmountInput setAmount={setBuyAmount} isMarketClicked={isMarketClicked} tokenASymbol={tokenASymbol} tokenBSymbol={tokenBSymbol} isBuy="true"> </AmountInput>
              </div>
              <div className={styles.menuItem}>
                <AmountInput setAmount={setSellAmount} isMarketClicked={isMarketClicked} tokenASymbol={tokenASymbol} tokenBSymbol={tokenBSymbol} isBuy="false"> </AmountInput>
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <BuySellButton onClick={isLimitClicked ? placeBuyLimitOrder : placeBuyMarketOrder} color={buyColor} label="Buy ETH"></BuySellButton>
              <BuySellButton onClick={isLimitClicked ? placeSellLimitOrder : placeSellMarketOrder} color={sellColor} label="Sell ETH"></BuySellButton>
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
              <LimitMarketButton onClick={handleBuyOrdersClick} isClicked={isBuyOrdersClicked} label="Buy" bgColor={buyColor} width="30%"></LimitMarketButton>
              <LimitMarketButton onClick={handleSellOrdersClick} isClicked={isSellOrdersClicked} label="Sell" bgColor={sellColor} width="30%"></LimitMarketButton>
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
                    <td>{to4decimals(order.total)} <FontAwesomeIcon icon={faPenToSquare} style={{ position: "absolute", right: "0" }} /></td>
                  </tr>
                ))}
                {account && isBuyOrdersClicked && userBuyOrders[account] && userBuyOrders[account].length > 0 && userBuyOrders[account].map((order) => (
                  <tr key={order.price.toString() + order.id.toString()} onClick={() => handleRowClick(order)}>
                    <td style={{ color: buyColor }}>{to4decimals(order.price)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)} <FontAwesomeIcon icon={faPenToSquare} style={{ position: "absolute", right: "0" }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {showPopup && selectedRow && (
              <div className="popup">
                <Input width="100%" style={{ color: "white" }} labelRight={tokenBSymbol} placeHolder={selectedRow.price} label="price" css={{ $$inputColor: "#525257", marginBottom: "1em" }} value={popupPrice} onChange={(e) => setPopupPrice(e.target.value)} />
                <Input width="100%" style={{ color: "white" }} labelRight={tokenASymbol} placeHolder={selectedRow.amount} label="amount" css={{ $$inputColor: "#525257", marginBottom: "2em" }} value={popupAmount} onChange={(e) => setPopupAmount(e.target.value)} />
                <div className="popup-button-container">
                  <Button size="sm" style={{ backgroundColor: "#525257", marginRight: "0.5em", fontFamily: 'Montserrat, sans-serif' }} onClick={handleSave}>Edit</Button>
                  <Button size="sm" style={{ backgroundColor: "#525257", marginLeft: "0.5em", fontFamily: 'Montserrat, sans-serif' }} onClick={handleRemove}>Remove</Button>
                </div>
                <div className="popup-button-container">
                  <Button size="sm" style={{ backgroundColor: "#525257", marginTop: "1em", fontFamily: 'Montserrat, sans-serif' }} onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
