import { ref, onUnmounted } from "vue";

export function useWebSocket(url, topic, onMessageCallback) {
  const socket = ref(null);

  function connect() {
    socket.value = new WebSocket(url);

    socket.value.onopen = () => {
    //   console.log("WebSocket 連接成功");
      socket.value.send(JSON.stringify({ op: "subscribe", args: [topic] }));
    };

    socket.value.onmessage = (event) => {
    //   console.log("收到消息:", event.data);
      const data = JSON.parse(event.data);
      onMessageCallback(data);
    };

    socket.value.onclose = () => {
    //   console.warn("WebSocket 關閉");
      console.warn("WebSocket closed. Reconnecting...");
      setTimeout(connect, 1000); // 自動重連
    };

    socket.value.onerror = (error) => {
    //   console.error("WebSocket 錯誤:", error);
      console.error("WebSocket error:", error);
    };
  }

  connect();

  onUnmounted(() => {
    socket.value?.close();
  });
}
