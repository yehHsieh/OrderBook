<template>
  <tr
    v-for="(quote, index) in quotesList"
    :key="index"
    class="quote-row"
    :class="{ highlight: quote.isHighlighted }"
    @mouseover="hoverIndex = index"
    @mouseleave="hoverIndex = null"
  >
    <td
      class="p-0"
      :class="[type === 'sell' ? 'text-[#FF5B5A]' : 'text-[#00b15d]']"
    >
      {{ formatNumber(quote.price) }}
    </td>
    <td
      class="p-0"
      :class="{
        'size-increase': quote.isSizeIncrease,
        'size-decrease': quote.isSizeDecrease,
      }"
    >
      {{ formatNumber(quote.size) }}
    </td>
    <td class="relative p-0">
      <div
        class="absolute inset-y-0 right-0 h-full bg-[rgba(255,90,90,0.12)]"
        :style="{ width: quote.percentage + '%' }"
      ></div>
      <span class="relative z-10">
        {{ formatNumber(quote.accumulated) }}
      </span>
    </td>
  </tr>
</template>

<script setup>
const props = defineProps({
  quotesList: Array,
  type: String,
});

// 格式化數字
function formatNumber(num) {
  const parsedNum = parseFloat(num);
  return isNaN(parsedNum) ? num : parsedNum.toLocaleString();
}
</script>

<style scoped>
.quote-row {
  cursor: pointer;
  transition: background 0.3s;
}

.quote-row:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.quote-row.highlight {
  animation: highlight 1s;
}

@keyframes highlight {
  0% {
    background-color: #00b15d;
  }
  100% {
    background-color: transparent;
  }
}

.size-increase {
  animation: increaseHighlight 1s;
}

.size-decrease {
  animation: decreaseHighlight 1s;
}

@keyframes increaseHighlight {
  0% {
    background-color: rgba(0, 177, 93, 0.5);
  }
  100% {
    background-color: transparent;
  }
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
