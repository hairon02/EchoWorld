import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket(url = "/") {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = io(url);

    client.on("connect", () => setConnected(true));
    client.on("disconnect", () => setConnected(false));

    setSocket(client);
    return () => {
      client.disconnect();
    };
  }, [url]);

  return { socket, connected };
}
