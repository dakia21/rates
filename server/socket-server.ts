import { createServer } from "http";
import { Server } from "socket.io";
import { verifySocketAuth } from "../src/lib/auth/jwt";
import { createClient } from "@supabase/supabase-js";

const PORT = parseInt(process.env.SOCKET_PORT || "3001");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const onlineUsers = new Map<string, string>();
const typingUsers = new Map<string, Map<string, NodeJS.Timeout>>();

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;

  if (!token || !userId) {
    return next(new Error("Authentication required"));
  }

  const verifiedUserId = await verifySocketAuth(token);
  if (!verifiedUserId || verifiedUserId !== userId) {
    return next(new Error("Invalid token"));
  }

  socket.data.userId = userId;
  next();
});

io.on("connection", async (socket) => {
  const userId = socket.data.userId as string;
  onlineUsers.set(userId, socket.id);

  await supabase
    .from("profiles")
    .update({ is_online: true, last_seen: new Date().toISOString() })
    .eq("id", userId);

  io.emit("user:online", { userId });

  socket.on("chat:join", (chatId: string) => {
    socket.join(`chat:${chatId}`);
  });

  socket.on("chat:leave", (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on("typing:start", ({ chatId }: { chatId: string }) => {
    if (!typingUsers.has(chatId)) {
      typingUsers.set(chatId, new Map());
    }

    const chatTyping = typingUsers.get(chatId)!;
    if (chatTyping.has(userId)) {
      clearTimeout(chatTyping.get(userId)!);
    }

    socket.to(`chat:${chatId}`).emit("typing:start", {
      chatId,
      userId,
      username: socket.handshake.auth.username || "User",
    });

    const timeout = setTimeout(() => {
      chatTyping.delete(userId);
      socket.to(`chat:${chatId}`).emit("typing:stop", { chatId, userId });
    }, 3000);

    chatTyping.set(userId, timeout);
  });

  socket.on("typing:stop", ({ chatId }: { chatId: string }) => {
    const chatTyping = typingUsers.get(chatId);
    if (chatTyping?.has(userId)) {
      clearTimeout(chatTyping.get(userId)!);
      chatTyping.delete(userId);
    }
    socket.to(`chat:${chatId}`).emit("typing:stop", { chatId, userId });
  });

  socket.on("message:send", async (message) => {
    io.to(`chat:${message.chat_id}`).emit("message:new", message);
  });

  socket.on("notification:send", (notification) => {
    const targetSocketId = onlineUsers.get(notification.user_id);
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification:new", notification);
    }
  });

  socket.on("disconnect", async () => {
    onlineUsers.delete(userId);

    await supabase
      .from("profiles")
      .update({ is_online: false, last_seen: new Date().toISOString() })
      .eq("id", userId);

    io.emit("user:offline", { userId });

    typingUsers.forEach((chatTyping, chatId) => {
      if (chatTyping.has(userId)) {
        clearTimeout(chatTyping.get(userId)!);
        chatTyping.delete(userId);
        io.to(`chat:${chatId}`).emit("typing:stop", { chatId, userId });
      }
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
