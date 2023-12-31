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
import NavbarLabel from './NavbarLabel';
import DocsLabel from './DocsLabel';
import { Loading } from '@nextui-org/react';
import moment from 'moment';
import * as tf from '@tensorflow/tfjs'

import styles from './page.module.css'
import { ethers } from 'ethers';
import Web3 from 'web3';

export default function Home() {
  const nnAbi = require("../contracts/NN.json").abi;
  const dexBookAbi = require("../contracts/DexBook.json").abi;
  const tokenAabi = require("../contracts/USDC.json").abi;
  const tokenBabi = require("../contracts/WETH.json").abi;
  const rpcUrl = "https://apothem.xdcrpc.com"

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
  const [chartData, setChartData] = useState({chartData: [], chartLabels: []});

  const [selectedRow, setSelectedRow] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPrice, setPopupPrice] = useState(0);
  const [popupAmount, setPopupAmount] = useState(0);

  const [pairs, setPairs] = useState([]);

  const [sellOrdersLoading, setSellOrdersLoading] = useState(true);
  const [buyOrdersLoading, setBuyOrdersLoading] = useState(true);
  const [userSellOrdersLoading, setUserSellOrdersLoading] = useState(true);
  const [userBuyOrdersLoading, setUserBuyOrdersLoading] = useState(true);
  const [tokenSymbolsLoading, setTokenSymbolsLoading] = useState(true);
  const [priceLoading, setPriceLoading] = useState(true);
  const [pairsLoading, setPairsLoading] = useState(true);
  const [priceGraphLoading, setPriceGraphLoading] = useState(true);

  const [tokenABalance, setTokenABalance] = useState(0);
  const [tokenBBalance, setTokenBBalance] = useState(0);

  const [nnPrice, setNNPrice] = useState(0);
  const nnAddress = "0xD87D11f9832e39E4394D4118766ed9e76188e51A";

  const [dexBookAddress, setDexBookAddress] = useState("0x78a82ACE5c7133918ca7Be3DB3EAb3a1046232AC");

  const dexbooks = [
    "0x8734c402782382E6eC48638Fc64A11C4DCcdDce1",
    "0xE002bc2Eab8dE575a372D13eD5ABAAb206ABb0ba",
    "0x78a82ACE5c7133918ca7Be3DB3EAb3a1046232AC"
  ];

  const buyColor = "green"
  const sellColor = "red"

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

  const handleRowClick = (order, isBuy) => {
    setSelectedRow(order);
    setShowPopup(true);
    const adjustedPrice = isBuy ? pricePrecision / order.price : order.price / pricePrecision;
    setPopupPrice(to4decimals(adjustedPrice));
    setPopupAmount(to4decimals(order.amount));
  };

  const handleSave = async () => {
    if (isBuyOrdersClicked) {
      const oldOrder = selectedRow;
      const oldBuyAmountWithDecimalsFactor = BigInt(Math.round(oldOrder.amount * tokenADecimalsFactor));
      const oldBuyPriceWithPrecision = BigInt(oldOrder.price);
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
      const oldSellPriceWithPrecision = BigInt(oldOrder.price);
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
      await dexBookContractWrite.removeBuyLimitOrder(selectedRow.id, BigInt(selectedRow.price));
    } else if (isSellOrdersClicked) {
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
      await dexBookContractWrite.removeSellLimitOrder(selectedRow.id, BigInt(selectedRow.price));
    }
    setSelectedRow(null);
    setShowPopup(false);
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function to4decimals(number) {
    return Number(number).toFixed(3);
  }

  async function placeBuyLimitOrder() {
    const buyAmountWithDecimalsFactor = BigInt(Math.round(buyAmount * tokenADecimalsFactor));
    const buyPriceWithPrecision = BigInt(Math.round(pricePrecision / buyPrice));
    const tokenBamountWithDecimalsFactor = await dexBookRead.tokenAToTokenB(buyAmountWithDecimalsFactor, buyPriceWithPrecision);

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    await approveTokenB(signer, tokenBamountWithDecimalsFactor);

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);

    let prevPrice = buyOrders.findLast(order => order.price < buyPriceWithPrecision);
    let nextPrice = buyOrders.find(order => order.price > buyPriceWithPrecision);
    prevPrice = prevPrice ? prevPrice.price : 0;
    nextPrice = nextPrice ? nextPrice.price : 0;

    await dexBookContractWrite.placeBuyLimitOrder(buyAmountWithDecimalsFactor, buyPriceWithPrecision, [prevPrice, 0], [nextPrice, 0]);
  }

  async function placeSellLimitOrder() {
    const sellAmountWithDecimalsFactor = BigInt(Math.round(sellAmount * sellPrice * tokenBDecimalsFactor));
    const sellPriceWithPrecision = BigInt(Math.round(sellPrice * pricePrecision));
    const tokenAamountWithDecimalsFactor = await dexBookRead.tokenBToTokenA(sellAmountWithDecimalsFactor, sellPriceWithPrecision);

    const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

    await approveTokenA(signer, tokenAamountWithDecimalsFactor);

    let prevPrice = sellOrders.find(order => order.price < sellPriceWithPrecision);
    let nextPrice = sellOrders.findLast(order => order.price > sellPriceWithPrecision);
    prevPrice = prevPrice ? prevPrice.price : 0;
    nextPrice = nextPrice ? nextPrice.price : 0;

    const dexBookContractWrite = new ethers.Contract(dexBookAddress, dexBookAbi, signer);
    await dexBookContractWrite.placeSellLimitOrder(sellAmountWithDecimalsFactor, sellPriceWithPrecision, [prevPrice, 0], [nextPrice, 0]);
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

  async function tokenAFaucet() {
    try {
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const tokenAContractWrite = new ethers.Contract(tokenA.address, tokenAabi, signer);
      await tokenAContractWrite.faucet();
    } catch (error) { console.log(error) }
  }

  async function tokenBFaucet() {
    try {
      const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();
      const tokenBContractWrite = new ethers.Contract(tokenB.address, tokenBabi, signer);
      await tokenBContractWrite.faucet();
    } catch (error) { console.log(error) }
  }

  function predictPrice(model, timestamps, prices) {
    timestamps = timestamps.map((timestamp) => new Date(timestamp).getTime());

    const numDays = 10;
    let pricesPast10Days = [...Array(numDays).keys()];
    let oneDay = 24 * 60 * 60 * 1000;
    let pastDay = Date.now() - oneDay;
    let lastNonZeroPrice = 0;

    for (let i = numDays - 1; i >= 0; i--) {
      const pastDayPrices = prices.filter((prices, idx) => timestamps[idx] > pastDay && timestamps[idx] < pastDay + oneDay);
      pricesPast10Days[i] = calculateAverage(pastDayPrices);
      pastDay -= oneDay;
      lastNonZeroPrice = pricesPast10Days[i] != 0 ? pricesPast10Days[i] : lastNonZeroPrice;
    } 

    let previousPrice = 0;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] < Date.now() - oneDay*numDays) {
        previousPrice = timestamps[i];
        break;
      }
    }

    for (let i = 0; i < numDays; i++) {
      if (pricesPast10Days[i] != 0) {
        previousPrice = pricesPast10Days[i];
        continue;
      }
      pricesPast10Days[i] = previousPrice == 0 ? lastNonZeroPrice : previousPrice;
    }

    const min = Math.min(...pricesPast10Days);
    const max = Math.max(...pricesPast10Days);

    const X_std = pricesPast10Days.map(value => min != max ? (value - min)*1.0 / (max - min) : 1.0);

    const reshapedInput = tf.reshape(X_std, [1, X_std.length, 1]);

    const price = (model.predict(reshapedInput).arraySync()[0] * (max - min) + min);
    setNNPrice(price);
  }

  function calculateAverage(array) {
    if (!array || array.length === 0) return 0;
    const sum = array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const average = sum / array.length;
    return average;
  }

  useEffect(() => {
    const bootstrapDexBook = async () => {
      setSellOrdersLoading(true);
      setBuyOrdersLoading(true);
      setUserSellOrdersLoading(true);
      setUserBuyOrdersLoading(true);
      setTokenSymbolsLoading(true);
      setPriceLoading(true);
      setPairsLoading(true);
      setPriceGraphLoading(true);

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
      setTokenSymbolsLoading(false);

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
            ? userSellOrdersComputed[order.maker].unshift({ id: order.id, price: priceBracket.price, amount: amount, total: tokenBAmount })
            : userSellOrdersComputed[order.maker] = [{ id: order.id, price: priceBracket.price, amount: amount, total: tokenBAmount }];
        }
        const index = sellOrdersComputed.findIndex(order => to4decimals(order.price / pricePrecisionRead) === to4decimals(priceBracket.price / pricePrecisionRead));
        if (index === -1) {
          sellOrdersComputed.unshift({ price: priceBracket.price, amount: accumulatedAmount, total: accumulatedCost });
        } else {
          sellOrdersComputed[index].amount += accumulatedAmount;
          sellOrdersComputed[index].total += accumulatedCost;
        }
      }
      setSellOrders(sellOrdersComputed);
      setSellOrdersLoading(false);
      setSellPrice(sellOrdersComputed.length > 0 ? Number(sellOrdersComputed[sellOrdersComputed.length - 1].price / pricePrecisionRead).toFixed(3) : 0);
      setUserSellOrders(userSellOrdersComputed);
      setUserSellOrdersLoading(false);

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
            ? userBuyOrdersComputed[order.maker].push({ id: order.id, price: priceBracket.price, amount: amount, total: cost })
            : userBuyOrdersComputed[order.maker] = [{ id: order.id, price: priceBracket.price, amount: amount, total: cost }];
        }
        const index = buyOrdersComputed.findIndex(order => to4decimals(pricePrecisionRead / order.price) === to4decimals(pricePrecisionRead / priceBracket.price));
        if (index === -1) {
          buyOrdersComputed.push({ price: priceBracket.price, amount: accumulatedAmount, total: accumulatedCost });
        } else {
          buyOrdersComputed[index].amount += accumulatedAmount;
          buyOrdersComputed[index].total += accumulatedCost;
        }
      }
      setBuyOrders(buyOrdersComputed);
      setBuyOrdersLoading(false);
      setBuyPrice(buyOrdersComputed.length > 0 ? Number(pricePrecisionRead / buyOrdersComputed[0].price).toFixed(3) : 0);
      setUserBuyOrders(userBuyOrdersComputed);
      setUserBuyOrdersLoading(false);

      const buyEvents = await dexBookContractRead.queryFilter("BuyMarketOrderFilled", 51488784);
      const sellEvents = await dexBookContractRead.queryFilter("SellMarketOrderFilled", 51488784);
      const marketOrdersRead = [...buyEvents, ...sellEvents].sort((a, b) => a.args.timestamp - b.args.timestamp);

      const mostRecentBuyPrice = buyEvents.length == 0 ? 0 : buyEvents[buyEvents.length - 1].args.price / pricePrecisionRead;
      const mostRecentSellPrice = sellEvents.length == 0 ? 0 : sellEvents[sellEvents.length - 1].args.price / pricePrecisionRead;
      const isSellTheMostRecentPrice = sellEvents.length > 0 && (buyEvents.length === 0 || sellEvents[sellEvents.length - 1].blockNumber > buyEvents[buyEvents.length - 1].blockNumber);
      setPrice(isSellTheMostRecentPrice ? mostRecentSellPrice : mostRecentBuyPrice);
      setPriceColor(isSellTheMostRecentPrice ? sellColor : buyColor);
      setPriceLoading(false);

      const chartLabelsComputed = marketOrdersRead.map(order => moment(new Date(Number(order.args.timestamp) * 1000)).format("YYYY-MM-DD HH:mm:ss"));
      const chartDataComputed = marketOrdersRead.map(order => Number(order.args.price) / Number(pricePrecisionRead));
      setChartData({chartData: chartDataComputed, chartLabels: chartLabelsComputed});
      setPriceGraphLoading(false);

      const nnModelRead = new ethers.Contract(nnAddress, nnAbi, new ethers.providers.JsonRpcProvider(rpcUrl));
      const numberOfChunks = await nnModelRead.getNumberOfChunks();
      let data = "";
      for (let i = 0; i < numberOfChunks; i++) {
        const chunk = await nnModelRead.getNNChunk(i);
        data += chunk;
      }
      const modelData = JSON.parse(data);
      const modelJson = JSON.parse(modelData.model);
      const weights = modelData.weights.map(weightArray => tf.tensor(weightArray));
      const model = await tf.models.modelFromJSON(modelJson);
      model.setWeights(weights);
      predictPrice(model, chartLabelsComputed, chartDataComputed)

      let pairsRead = [];
      for (const dexBookPairAddress of dexbooks) {
        if (dexBookPairAddress === dexBookAddress) continue;
        const dexBookPair = new ethers.Contract(dexBookPairAddress, dexBookAbi, new ethers.providers.JsonRpcProvider(rpcUrl));
        const tokenAPair = new ethers.Contract(await dexBookPair.tokenA(), tokenAabi, new ethers.providers.JsonRpcProvider(rpcUrl));
        const tokenBPair = new ethers.Contract(await dexBookPair.tokenB(), tokenAabi, new ethers.providers.JsonRpcProvider(rpcUrl));
        const tokenASymbolPair = await tokenAPair.symbol();
        const tokenBSymbolPair = await tokenBPair.symbol();

        const buyEvents = await dexBookPair.queryFilter("BuyMarketOrderFilled", 51488784);
        const sellEvents = await dexBookPair.queryFilter("SellMarketOrderFilled", 51488784);

        const mostRecentBuyPrice = buyEvents.length == 0 ? 0 : buyEvents[buyEvents.length - 1].args.price / pricePrecisionRead;
        const mostRecentSellPrice = sellEvents.length == 0 ? 0 : sellEvents[sellEvents.length - 1].args.price / pricePrecisionRead;
        const isSellTheMostRecentPrice = sellEvents.length > 0 && (buyEvents.length === 0 || sellEvents[sellEvents.length - 1].blockNumber > buyEvents[buyEvents.length - 1].blockNumber);
        const pricePair = isSellTheMostRecentPrice ? mostRecentSellPrice : mostRecentBuyPrice;

        const buyEvent24hAgo = buyEvents.length > 0 && buyEvents.find(event => event.args.timestamp > (Date.now() / 1000 - 86400)) || buyEvents[0];
        const buyPrice24hAgo = buyEvent24hAgo ? buyEvent24hAgo.args.price / pricePrecisionRead : 0;
        const sellEvent24hAgo = sellEvents.length > 0 && sellEvents.find(event => event.args.timestamp > (Date.now() / 1000 - 86400)) || sellEvents[0];
        const sellPrice24hAgo = sellEvent24hAgo ? Number(sellEvent24hAgo.args.price / pricePrecisionRead).toFixed(3) : 0;

        const pairPrice24hAgo = buyEvent24hAgo && sellEvent24hAgo ? buyEvent24hAgo.blockNumber < sellEvent24hAgo.blockNumber ? buyPrice24hAgo : sellPrice24hAgo : buyPrice24hAgo || sellPrice24hAgo;
        const pairPrice24hChange = pairPrice24hAgo ? Number((pricePair - pairPrice24hAgo) / pairPrice24hAgo * 100).toFixed(3) : 0;

        pairsRead.push({ address: dexBookPairAddress, pair: tokenASymbolPair + "/" + tokenBSymbolPair, change: pairPrice24hChange, price: pricePair.toFixed(3)});
      };
      setPairs(pairsRead);
      setPairsLoading(false);

      dexBookContractRead.removeAllListeners();

      dexBookContractRead.on("BuyLimitOrderPlaced", async (orderId, price, maker, amount) => {
        const priceComputed = pricePrecisionRead / price;
        const amountComputed = amount / tokenADecimalsFactorRead;
        const totalComputed = amountComputed * priceComputed;
        const newBuyOrder = { id: orderId, price: price, amount: amountComputed, total: totalComputed };
        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => to4decimals(pricePrecisionRead / order.price) == to4decimals(priceComputed));
          if (index === -1) {
            return [...prevBuyOrders, newBuyOrder].sort((a, b) => a.price - b.price)
          }
          prevBuyOrders[index].amount += amountComputed;
          prevBuyOrders[index].total += totalComputed;
          return [...prevBuyOrders];

        });
        setUserBuyOrders(userBuyOrders => {
          let newUserBuyOrders = userBuyOrders[maker];
          if (!newUserBuyOrders) newUserBuyOrders = [];
          newUserBuyOrders.push(newBuyOrder);
          newUserBuyOrders.sort((a, b) => a.price - b.price);
          userBuyOrders[maker] = newUserBuyOrders;
          return userBuyOrders
        });
      });

      dexBookContractRead.on("SellLimitOrderPlaced", async (orderId, price, maker, amount) => {
        const totalComputed = amount / tokenBDecimalsFactorRead;
        const priceComputed = price / pricePrecisionRead;
        const amountComputed = totalComputed / priceComputed;
        const newSellOrder = { id: orderId, price: price, amount: amountComputed, total: totalComputed };
        setSellOrders(sellOrders => {
          const index = sellOrders.findIndex(order => to4decimals(order.price / pricePrecisionRead) == to4decimals(priceComputed));
          if (index === -1) {
            return [...sellOrders, newSellOrder].sort((a, b) => b.price - a.price)
          }

          sellOrders[index].amount += amountComputed;
          sellOrders[index].total += totalComputed;
          return [...sellOrders];
        });
        setUserSellOrders(userSellOrders => {
          let newUserSellOrders = userSellOrders[maker];
          if (!newUserSellOrders) newUserSellOrders = [];
          newUserSellOrders.push(newSellOrder);
          newUserSellOrders.sort((a, b) => b.price - a.price);
          userSellOrders[maker] = newUserSellOrders;
          return userSellOrders;
        });
      });

      dexBookContractRead.on("BuyMarketOrderFilled", async (timestamp, price, maker, amount) => {
        const newPrice = price / pricePrecisionRead;
        const newTimestamp = moment(new Date(Number(timestamp) * 1000)).format("YYYY-MM-DD HH:mm:ss");
        setPrice(newPrice);
        setPriceColor(buyColor);
        setChartData(chartData => {
          const newChartData = {chartData: [...chartData.chartData, newPrice], chartLabels: [...chartData.chartLabels, newTimestamp]}
          if (dexBookAddress == dexbooks[2]) predictPrice(model, newChartData.chartLabels, newChartData.chartData);
          return newChartData;
        });
      });

      dexBookContractRead.on("SellMarketOrderFilled", async (timestamp, price, maker, amount) => {
        const newPrice = price / pricePrecisionRead;
        const newTimestamp = moment(new Date(Number(timestamp) * 1000)).format("YYYY-MM-DD HH:mm:ss");
        setPrice(newPrice);
        setPriceColor(sellColor);
        setChartData(chartData => {
          const newChartData = {chartData: [...chartData.chartData, newPrice], chartLabels: [...chartData.chartLabels, newTimestamp]}
          if (dexBookAddress == dexbooks[2]) predictPrice(model, newChartData.chartLabels, newChartData.chartData);
          return newChartData;
        });
      });

      dexBookContractRead.on("BuyLimitOrderFilled", async (orderId_, price, maker, amount) => {
        const priceComputed = pricePrecisionRead / price;
        const amountComputed = amount / tokenADecimalsFactorRead;
        const totalComputed = amountComputed * priceComputed;
        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => to4decimals(pricePrecisionRead / order.price) == to4decimals(priceComputed));
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
          const index = prevUserBuyOrders[maker].findIndex(order => Number(order.price) == Number(price) && order.id === orderId_);
          const newAmount = prevUserBuyOrders[maker][index].amount - amountComputed;
          if (newAmount <= 0) {
            prevUserBuyOrders[maker].splice(index, 1);
          } else {
            prevUserBuyOrders[maker][index].amount = newAmount;
            prevUserBuyOrders[maker][index].total = prevUserBuyOrders[maker][index].total - totalComputed;
          }
          return prevUserBuyOrders;
        });
      });

      dexBookContractRead.on("SellLimitOrderFilled", async (orderId_, price, maker, amount) => {
        const totalComputed = amount / tokenBDecimalsFactorRead;
        const priceComputed = price / pricePrecisionRead;
        const amountComputed = totalComputed / priceComputed;
        setSellOrders(prevSellOrders => {
          const index = prevSellOrders.findIndex(order => to4decimals(order.price / pricePrecisionRead) == to4decimals(priceComputed));
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
          const index = prevUserSellOrders[maker].findIndex(order => Number(order.price) == Number(price) && order.id === orderId_);
          const newAmount = prevUserSellOrders[maker][index].amount - amountComputed;
          if (newAmount.toFixed(4) <= 0) {
            prevUserSellOrders[maker].splice(index, 1);
          } else {
            prevUserSellOrders[maker][index].amount = newAmount;
            prevUserSellOrders[maker][index].total = prevUserSellOrders[maker][index].total - totalComputed;
          }
          return prevUserSellOrders;
        });
      });

      dexBookContractRead.on("BuyLimitOrderCancelled", async (orderId_, price, maker, amount) => {
        const priceComputed = pricePrecisionRead / price;
        const amountComputed = amount / tokenADecimalsFactorRead;
        const totalComputed = amountComputed * priceComputed;
        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => to4decimals(pricePrecisionRead / order.price) == to4decimals(priceComputed));
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
          const index = prevUserBuyOrders[maker].findIndex(order => Number(order.price) == Number(price) && order.id === orderId_);
          prevUserBuyOrders[maker].splice(index, 1);
          return prevUserBuyOrders;
        });
      });

      dexBookContractRead.on("SellLimitOrderCancelled", async (orderId_, price, maker, amount) => {
        const totalComputed = amount / tokenBDecimalsFactorRead;
        const priceComputed = price / pricePrecisionRead;
        const amountComputed = totalComputed / priceComputed;
        setSellOrders(prevSellOrders => {
          const index = prevSellOrders.findIndex(order => to4decimals(order.price / pricePrecisionRead) == to4decimals(priceComputed));
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
          const index = prevUserSellOrders[maker].findIndex(order => Number(order.price) == Number(price) && order.id === orderId_);
          prevUserSellOrders[maker].splice(index, 1);
          return prevUserSellOrders;
        });
      });

      dexBookContractRead.on("BuyLimitOrderModified", async (orderId, price, maker, prevAmount, amount) => {
        const priceComputed = Number(pricePrecisionRead / price);
        const oldAmountComputed = Number(prevAmount / tokenADecimalsFactorRead);
        const oldTotalComputed = Number(oldAmountComputed * priceComputed);
        const amountComputed = Number(amount / tokenADecimalsFactorRead);
        const totalComputed = Number(amountComputed * priceComputed);

        setBuyOrders(prevBuyOrders => {
          const index = prevBuyOrders.findIndex(order => to4decimals(pricePrecisionRead / order.price) == to4decimals(priceComputed));
          prevBuyOrders[index].amount = prevBuyOrders[index].amount - oldAmountComputed + amountComputed;
          prevBuyOrders[index].total = prevBuyOrders[index].total - oldTotalComputed + totalComputed;
          return [...prevBuyOrders];
        });
        setUserBuyOrders(prevUserBuyOrders => {
          const index = prevUserBuyOrders[maker].findIndex(order => Number(order.price) === Number(price) && order.id === orderId);
          prevUserBuyOrders[maker][index].amount = amountComputed;
          prevUserBuyOrders[maker][index].total = totalComputed;
          return prevUserBuyOrders;
        });
      });

      dexBookContractRead.on("SellLimitOrderModified", async (orderId, price, maker, prevAmount, amount) => {
        const totalComputed = Number(amount / tokenBDecimalsFactorRead);
        const oldTotalComputed = Number(prevAmount / tokenBDecimalsFactorRead);
        const priceComputed = Number(price / pricePrecisionRead);
        const amountComputed = Number(totalComputed / priceComputed);
        const oldAmountComputed = Number(oldTotalComputed / priceComputed);
        setSellOrders(prevSellOrders => {
          const index = prevSellOrders.findIndex(order => to4decimals(order.price / pricePrecisionRead) == to4decimals(priceComputed));
          prevSellOrders[index].amount = prevSellOrders[index].amount - oldAmountComputed + amountComputed;
          prevSellOrders[index].total = prevSellOrders[index].total - oldTotalComputed + totalComputed;
          return [...prevSellOrders];
        });
        setUserSellOrders(prevUserSellOrders => {
          const index = prevUserSellOrders[maker].findIndex(order => Number(order.price) == Number(price) && order.id === orderId);
          prevUserSellOrders[maker][index].amount = amountComputed;
          prevUserSellOrders[maker][index].total = totalComputed;
          return prevUserSellOrders;
        });
      });
    }

    bootstrapDexBook();
  }, [dexBookAddress]);

  useEffect(() => {
    if (!account || !tokenA || !tokenB || !tokenADecimalsFactor || !tokenBDecimalsFactor) return;

    const getBalances = async () => {
      const newBalanceA = await tokenA.balanceOf(account) / tokenADecimalsFactor;
      const newBalanceB = await tokenB.balanceOf(account) / tokenBDecimalsFactor;
      setTokenABalance(Number(newBalanceA));
      setTokenBBalance(Number(newBalanceB));
    };

    const interval = setInterval(() => {
      getBalances();
    }, 2000);

    getBalances();

    return () => {
      clearInterval(interval);
    };
  }, [account, tokenA, tokenB, tokenADecimalsFactor, tokenBDecimalsFactor]);

  return (
      <div className={styles.myApp}>
      <div className={styles.navbar}>
      <div className={styles.leftSection}>
        {!tokenSymbolsLoading && (<NavbarButton onClick={tokenAFaucet} label={tokenASymbol + " Faucet"} marginLeft="0.5em"> </NavbarButton>)}
        {tokenSymbolsLoading && (<Loading style = {{marginLeft: "3%"}} css={{$$loadingColor: "grey"}}></Loading>)}
        {!tokenSymbolsLoading && (<NavbarButton onClick={tokenBFaucet} label={tokenBSymbol + " Faucet"}> </NavbarButton>)}
        {tokenSymbolsLoading && (<Loading style = {{marginLeft: "6%"}} css={{$$loadingColor: "grey"}}></Loading>)}
        {dexBookAddress == dexbooks[2] && <NavbarLabel label={nnPrice.toFixed(3)} isLoading={priceLoading} tokenSymbol={tokenBSymbol} toolTipLabel="Neural network 24h price estimate based on last 10 days"></NavbarLabel>}
        {dexBookAddress != dexbooks[2] && <NavbarLabel label="N/A" isLoading={priceLoading} tokenSymbol={tokenBSymbol} toolTipLabel="Price estimate only available on WBTC/USDC"></NavbarLabel>}
      </div>
      <div className={styles.rightSection}>
        <NavbarLabel label={tokenABalance.toFixed(3)} isLoading={tokenSymbolsLoading} tokenSymbol={tokenASymbol} toolTipLabel={tokenASymbol + " Balance"}></NavbarLabel>
        <NavbarLabel label={tokenBBalance.toFixed(3)} isLoading={tokenSymbolsLoading} tokenSymbol={tokenBSymbol} toolTipLabel={tokenBSymbol + " Balance"}></NavbarLabel>
        <DocsLabel></DocsLabel>
        {account ? (
          <NavbarButton onClick={() => { }} label={account.slice(0, 6) + "..." + account.slice(-4)}>
          </NavbarButton>
        ) : (
          <NavbarButton onClick={connectToMetaMask} label="Connect Wallet">
          </NavbarButton>
        )}
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.fortyFivePercentLine}>
            {sellOrdersLoading && (<Loading style={{position: "relative", left: "42%"}} css={{ $$loadingColor: "grey" }}></Loading>)}
            {!sellOrdersLoading && (<table className="order-table">
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
                    <td style={{ color: sellColor }}>{to4decimals(order.price / pricePrecision)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>)}
          </div>
          <div className={styles.tenPercentLine}>
            {priceLoading && (<Loading css={{ $$loadingColor: "grey" }}></Loading>)}
            {!priceLoading && <div style={{ color: priceColor }}>
              {price?.toFixed(4)}
            </div>}
          </div>
          <div className={styles.fortyFivePercentLine}>
          {buyOrdersLoading && (<Loading style={{position: "relative", left: "42%"}} css={{ $$loadingColor: "grey" }}></Loading>)}
            {!buyOrdersLoading && (<table className="order-table">
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
                    <td style={{ color: buyColor }}>{to4decimals(pricePrecision / order.price)}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>)}
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.sixtyPercentLine}>
            {priceGraphLoading && (<Loading style={{position: "relative", left: "49%"}} css={{ $$loadingColor: "grey" }}></Loading>)}
            {!priceGraphLoading && (<PriceChart chartLabels={chartData.chartLabels} chartData={chartData.chartData}></PriceChart>)}
          </div>
          <div className={styles.fortyPercentLine}>
            <div className={styles.switchContainer}>
              <LimitMarketButton isClicked={isLimitClicked} onClick={handleLimitClick} label="Limit" bgColor="green" width="15%"></LimitMarketButton>
              <LimitMarketButton isClicked={isMarketClicked} onClick={handleMarketClick} label="Market" bgColor="green" width="15%"></LimitMarketButton>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <PriceInput isLimitClicked={isLimitClicked} setPrice={setBuyPrice} isMarketClicked={isMarketClicked} tokenSymbol={tokenBSymbol}  isLoading={tokenSymbolsLoading} value={buyPrice}></PriceInput>
              </div>
              <div className={styles.menuItem}>
                <PriceInput isLimitClicked={isLimitClicked} setPrice={setSellPrice} isMarketClicked={isMarketClicked} tokenSymbol={tokenBSymbol} isLoading={tokenSymbolsLoading} value={sellPrice}></PriceInput>
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <div className={styles.menuItem}>
                <AmountInput setAmount={setBuyAmount} isMarketClicked={isMarketClicked} tokenASymbol={tokenASymbol} tokenBSymbol={tokenBSymbol} isBuy={true} isLoading={tokenSymbolsLoading}> </AmountInput>
              </div>
              <div className={styles.menuItem}>
                <AmountInput setAmount={setSellAmount} isMarketClicked={isMarketClicked} tokenASymbol={tokenASymbol} tokenBSymbol={tokenBSymbol} isBuy={false} isLoading={tokenSymbolsLoading}> </AmountInput>
              </div>
            </div>
            <div className={styles.buttonContainer}>
              <BuySellButton onClick={isLimitClicked ? placeBuyLimitOrder : placeBuyMarketOrder} color={buyColor} label={"Buy " + tokenASymbol} isLoading={tokenSymbolsLoading} isDisabled={(!buyPrice || buyPrice == 0 && isLimitClicked) || !buyAmount || buyAmount == 0 || !account}></BuySellButton>
              <BuySellButton onClick={isLimitClicked ? placeSellLimitOrder : placeSellMarketOrder} color={sellColor} label={"Sell " + tokenASymbol} isLoading={tokenSymbolsLoading} isDisabled={(!sellPrice || sellPrice == 0 && isLimitClicked) || !sellAmount || sellAmount == 0 || !account}></BuySellButton>
            </div>
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.halfLine}>
            <table className="order-table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Price</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
              {pairsLoading && (<Loading style={{position: "relative", left: "42%"}} css={{ $$loadingColor: "grey" }}></Loading>)}
                {!pairsLoading && (pairs.map((pair) => (
                  pair.address !== dexBookAddress && (
                    <tr key={pair.address} onClick={() => setDexBookAddress(pair.address)}>
                      <td>{pair.pair}</td>
                      <td >{pair.price}</td>
                      <td style={{ color: pair.change == 0 ? "rgb(161, 161, 161)" : pair.change > 0 ? buyColor : sellColor}}>{pair.change + " %"}</td>
                    </tr>)
                )))}
              </tbody>
            </table>
          </div>
          <div className={styles.halfLine}>
            <div className={styles.myOrdersSwitchContainer}>
              <LimitMarketButton onClick={handleBuyOrdersClick} isClicked={isBuyOrdersClicked} label="Buy" bgColor={buyColor} width="30%"></LimitMarketButton>
              <LimitMarketButton onClick={handleSellOrdersClick} isClicked={isSellOrdersClicked} label="Sell" bgColor={sellColor} width="30%"></LimitMarketButton>
            </div>
            {account && (userSellOrdersLoading || userBuyOrdersLoading) && (<Loading style={{position: "relative", left: "42%"}} css={{ $$loadingColor: "grey" }}></Loading>)}
            {!showPopup && !userSellOrdersLoading && !userBuyOrdersLoading && (<table className="my-order-table">
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
                  <tr key={order.price.toString() + order.id.toString()} onClick={() => handleRowClick(order, false)} style={{cursor: "pointer"}}>
                    <td style={{ color: sellColor }}>{to4decimals(Number(order.price / pricePrecision))}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
                {account && isBuyOrdersClicked && userBuyOrders[account] && userBuyOrders[account].length > 0 && userBuyOrders[account].map((order) => (
                  <tr key={order.price.toString() + order.id.toString()} onClick={() => handleRowClick(order, true)} style={{cursor: "pointer"}}>
                    <td style={{ color: buyColor }}>{to4decimals(Number(pricePrecision / order.price))}</td>
                    <td>{to4decimals(order.amount)}</td>
                    <td>{to4decimals(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
            {showPopup && selectedRow && (
              <div className="popup">
                <div style={{ height: "15%" }}>
                  <PriceInput isLimitClicked={true} setPrice={setPopupPrice} isMarketClicked={false} tokenSymbol={tokenBSymbol} value={popupPrice}></PriceInput>
                </div>
                <div style={{ height: "15%", marginTop: "1em" }}>
                  <AmountInput setAmount={setPopupAmount} isMarketClicked={false} tokenASymbol={tokenASymbol} tokenBSymbol={tokenBSymbol} value={popupAmount}> </AmountInput>
                </div>
                <div className="popup-button-container">
                  <BuySellButton onClick={handleSave} color="white" label="Edit" isDisabled={!popupPrice || popupPrice == 0 || !popupAmount || popupAmount == 0}></BuySellButton>
                  <BuySellButton onClick={handleRemove} color="white" label="Remove"></BuySellButton>
                </div>
                <div className="popup-button-cancel">
                  <BuySellButton onClick={handleCancel} color="white" label="Cancel"></BuySellButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
