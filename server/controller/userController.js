import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Chat from "../models/Chat.js";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ✅ Fixed: Compare dates using UTC to avoid timezone issues
const resetDailyCreditsIfNeeded = async (user) => {
    const now = new Date();
    const last = new Date(user.lastCreditReset);

    // ✅ Compare date strings to avoid timezone bugs
    const nowDate = now.toISOString().split('T')[0];   // "2026-04-14"
    const lastDate = last.toISOString().split('T')[0]; // "2026-04-12"

    if (nowDate !== lastDate) {
        user.credits = 50;
        user.dailyCreditsUsed = 0;
        user.lastCreditReset = now;
        await user.save();
        console.log(`✅ Credits reset for: ${user.name}`);
    }
    return user;
};

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.json({ success: false, message: "User already exists" });
        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = generateToken(user._id);
                return res.json({ success: true, token });
            }
        }
        return res.json({ success: false, message: "Invalid email or password" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        let user = await User.findById(req.user._id);
        if (!user) return res.json({ success: false, message: "User not found" });

        // ✅ Reset credits if new day — triggers every app open
        user = await resetDailyCreditsIfNeeded(user);

        return res.json({ success: true, user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            { $unwind: "$messages" },
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    userName: "$userName"
                }
            }
        ]);
        res.json({ success: true, images: publishedImageMessages.reverse() });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};