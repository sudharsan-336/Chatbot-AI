import axios from "axios";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import imagekit from "../configs/imageKit.js";
import openai from "../configs/openai.js";
import { tavily } from "@tavily/core";

// ✅ Tavily web search client
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// ✅ Web search helper (IMPROVED)
const searchWeb = async (query) => {
  try {
    const currentYear = new Date().getFullYear();
    const enhancedQuery = `${query} ${currentYear} latest news today`;

    console.log("🔍 Searching web for:", enhancedQuery);

    const result = await tavilyClient.search(enhancedQuery, {
      maxResults: 5,
      searchDepth: "advanced",
    });

    const webData = result.results
      .map((r) => `${r.title}: ${r.content}`)
      .join("\n\n");

    console.log("✅ Web search done!");
    return webData;
  } catch (error) {
    console.log("❌ Web search failed:", error.message);
    return null;
  }
};

// ✅ Retry helper for 429 rate limit errors
const retryWithBackoff = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const status = error?.status || error?.response?.status;
      const is429 = status === 429;

      if (is429 && i < retries - 1) {
        console.log(`⚠️ Rate limited. Retrying in ${delay}ms... (${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
};

// ✅ Helper: Reset daily credits if new day
const resetDailyCreditsIfNeeded = (user) => {
  const now = new Date();
  const last = new Date(user.lastCreditReset);

  const nowDate = now.toISOString().split("T")[0];
  const lastDate = last.toISOString().split("T")[0];

  if (nowDate !== lastDate) {
    user.credits = 50;
    user.lastCreditReset = now;
    user.dailyCreditsUsed = 0;
  }
};

// ==========================
// ✅ TEXT MESSAGE CONTROLLER
// ==========================
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, prompt } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    resetDailyCreditsIfNeeded(user);

    if (user.credits < 1) {
      await user.save();
      return res.json({
        success: false,
        message: "Daily credit limit reached. Come back tomorrow!",
      });
    }

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) return res.json({ success: false, message: "Chat not found" });

    // ✅ Save user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // ✅ Always search web
    const webResults = await searchWeb(prompt);

    const today = new Date().toISOString().split("T")[0];

    let messages;

    if (webResults) {
      messages = [
        {
          role: "system",
          content: `You are a helpful AI assistant called QuickGPT. Today's date is ${today}. Use the following real-time web search results to answer the user's question accurately and in detail:\n\n${webResults}\n\nIf the web data contains the answer, use it. Otherwise use your own knowledge.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ];
    } else {
      messages = [
        {
          role: "system",
          content: `You are a helpful AI assistant called QuickGPT. Today's date is ${today}. Answer the user's questions accurately and in detail.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ];
    }

    // ✅ Call AI model with retry
    const { choices } = await retryWithBackoff(() =>
      openai.chat.completions.create({
        model: "gemini-3-flash-preview",
        messages: messages,
      })
    );

    const reply = {
      ...choices[0].message,
      timestamp: Date.now(),
      isImage: false,
    };

    chat.messages.push(reply);

    user.credits -= 1;
    user.dailyCreditsUsed += 1;

    await chat.save();
    await user.save();

    res.json({ success: true, reply });

  } catch (error) {
    console.log("REAL ERROR:", JSON.stringify(error, null, 2));

    const status = error?.status || error?.response?.status;

    if (status === 429) {
      return res.json({
        success: false,
        message: "AI is busy right now, please wait a few seconds and try again",
      });
    }

    res.json({ success: false, message: error.message });
  }
};

// ==========================
// ✅ IMAGE MESSAGE CONTROLLER
// ==========================
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { prompt, chatId, isPublished } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    resetDailyCreditsIfNeeded(user);

    if (user.credits < 1) {
      await user.save();
      return res.json({
        success: false,
        message: "Daily credit limit reached. Come back tomorrow!",
      });
    }

    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) return res.json({ success: false, message: "Chat not found" });

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    const encodedPrompt = encodeURIComponent(prompt);

    const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

    const aiImageResponse = await retryWithBackoff(() =>
      axios.get(generatedImageUrl, { responseType: "arraybuffer" })
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "quickgpt",
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };

    chat.messages.push(reply);

    user.credits -= 1;
    user.dailyCreditsUsed += 1;

    await chat.save();
    await user.save();

    res.json({ success: true, reply });

  } catch (error) {
    console.log("REAL ERROR:", JSON.stringify(error, null, 2));

    const status = error?.status || error?.response?.status;

    if (status === 429) {
      return res.json({
        success: false,
        message: "AI is busy right now, please wait a few seconds and try again! ⏳",
      });
    }

    res.json({ success: false, message: error.message });
  }
};