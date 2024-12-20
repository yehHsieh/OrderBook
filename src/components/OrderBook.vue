<template>
  <div class="flex flex-col bg-#131b29 w-240px">
    <h1 class="c-#f0f4f8 text-[16px] text-start p-6px b-b-solid b-.5px b-b-blueGray">Order Book</h1>
    <table>
      <thead>
        <tr class="c-#8698aa p-2px">
          <th>Price(USD)</th>
          <th class="text-end">Size</th>
          <th class="text-end">Total</th>
        </tr>
      </thead>
      <tbody>
        <OrderBookTableContent :quotesList="sellQuotes" :type="'sell'" />

        <!-- 最新價格顯示 -->

        <tr class="last-price" :class="lastPriceStyle">
          <td colspan="3" class="text-center">
            {{ formatNumber(lastPrice) }}
            <img
              :class="{ 'rotate-180 c-red': lastPrice > previousLastPrice }"
              class="inline-block align-middle icon-decrease"
              src="../assets/icon/IconArrowDown.svg"
              alt="Arrow Down"
            />
          </td>
        </tr>

        <OrderBookTableContent :quotesList="buyQuotes" :type="'buy'" />
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useWebSocket } from "../composables/useWebSocket.js";
import OrderBookTableContent from "./OrderBookTableContent.vue";

const lastPrice = ref(0);
const previousLastPrice = ref(0);
const totalSize = ref(0);

const buyQuotes = ref([]);
const sellQuotes = ref([]);

// WebSocket 處理邏輯
useWebSocket("wss://ws.btse.com/ws/oss/futures", "update:BTCPFC", (data) => {
  if (data.data?.type === "snapshot") {
    processSnapshot(data);
  } else if (data.data?.type === "delta") {
    // processDelta(data);
    processBuyQuotes(data);
    processSellQuotes(data);
  }
});

useWebSocket(
  "wss://ws.btse.com/ws/futures",
  "tradeHistoryApi:BTCPFC",
  (data) => {
    if (data) {
      if (lastPrice.value !== 0) {
        previousLastPrice.value = lastPrice.value;
      }

      lastPrice.value = data.data[0].price;
    }
  }
);

const setPriceOrder = (quote) => {
  return quote
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .slice(0, 8);
};

// 處理報價資料
function processSnapshot(data) {
  sellQuotes.value = data.data.asks.map((quote, index) => ({
    price: quote[0],
    size: quote[1],
    accumulated: 0,
  }));

  sellQuotes.value = setPriceOrder(sellQuotes.value);

  buyQuotes.value = data.data.bids.map((quote, index) => ({
    price: quote[0],
    size: quote[1],
    accumulated: 0,
  }));

  buyQuotes.value = setPriceOrder(buyQuotes.value);
  for (let i = buyQuotes.value.length - 1; i >= 0; i--) {
    totalSize.value += parseFloat(buyQuotes.value[i].size); // 從最高價格開始累加 size
    buyQuotes.value[i].accumulated = totalSize.value; // 設定累加值
  }
}

function processQuotes(newQuotes, targetQuotes, dataKey) {
  // 提取有效的報價資料
  const validQuotes = newQuotes.data[dataKey]
    .map((quote, index) => ({
      price: quote[0],
      size: quote[1],
    }))
    .filter((quote) => parseFloat(quote.size) > 0);

  // 用新報價資料更新原來的報價
  validQuotes.forEach((newQuote) => {
    // 查找現有報價中是否已經有相同價格的報價
    const existingQuote = targetQuotes.value.find(
      (quote) => parseFloat(quote.price) === parseFloat(newQuote.price)
    );

    if (existingQuote) {
      const sizeDifference =
        parseFloat(newQuote.size) - parseFloat(existingQuote.size);
      existingQuote.isSizeIncrease = sizeDifference > 0;
      existingQuote.isSizeDecrease = sizeDifference < 0;

      // 更新 size
      existingQuote.size = parseFloat(newQuote.size).toString();
    } else {
      newQuote.isHighlighted = true;

      // 新報價加入
      targetQuotes.value.push({ ...newQuote });
    }
  });

  // 根據價格從低到高排序
  targetQuotes.value.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  // 保證只保留前 8 名價格最高的
  targetQuotes.value = targetQuotes.value.slice(-8).reverse(); // 取最後 8 個並反轉為從高到低

  // 計算累計值 (從高價到低價累加)
  let accumulatedSize = 0;
  let totalSize = 0;
  for (let i = targetQuotes.value.length - 1; i >= 0; i--) {
    const quote = targetQuotes.value[i];
    accumulatedSize += parseFloat(quote.size);
    quote.accumulated = accumulatedSize.toString();
    totalSize += parseFloat(quote.size);
  }

  targetQuotes.value.forEach((quote) => {
    quote.percentage = (parseFloat(quote.accumulated) / totalSize) * 100;
  });
}

// 更新買方報價
function processBuyQuotes(newQuotes) {
  processQuotes(newQuotes, buyQuotes, "bids");
}

// 更新賣方報價
function processSellQuotes(newQuotes) {
  processQuotes(newQuotes, sellQuotes, "asks");
}

const lastPriceStyle = computed(() => {
  if (lastPrice.value > previousLastPrice.value) {
    return "up";
  } else if (lastPrice.value < previousLastPrice.value) {
    return "down";
  }
  return "neutral";
});

// 格式化數字
function formatNumber(num) {
  const parsedNum = parseFloat(num);
  return isNaN(parsedNum) ? num : parsedNum.toLocaleString();
}
</script>

<style scoped>
.last-price {
  padding: 10px;
  text-align: center;
}

.last-price.up {
  color: #00b15d;
  background-color: rgba(16, 186, 104, 0.12);
}

.last-price.down {
  color: #ff5b5a;
  background-color: rgba(255, 90, 90, 0.12);
}

.last-price.neutral {
  color: #f0f4f8;
  background-color: rgba(134, 152, 170, 0.12);
}

@keyframes decreaseHighlight {
  0% {
    background-color: rgba(255, 91, 90, 0.5);
  }
  100% {
    background-color: transparent;
  }
}
</style>
