import Transaction from "../models/Transaction.js";
import Stripe from "stripe";
import User from "../models/User.js";

// Get live USD to INR exchange rate
const getLiveExchangeRate = async () => {
    try {
        const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`
        );
        const data = await response.json();
        console.log("💱 Live USD to INR rate:", data.conversion_rates.INR);
        return data.conversion_rates.INR;
    } catch (error) {
        console.log("❌ Exchange rate fetch failed:", error.message);
        return 84;
    }
};

const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 2.5,
        credits: 100,
        features: [
            '100 text or image generations',
            'Standard support',
            'Access to basic models'
        ]
    },
    {
        _id: "pro",
        name: "Pro",
        price: 5,
        credits: 500,
        features: [
            '500 text or image generations',
            'Priority support',
            'Access to pro models',
            'Faster response time'
        ]
    },
    {
        _id: "premium",
        name: "Premium",
        price: 8,
        credits: 1000,
        features: [
            '1000 text or image generations',
            '24/7 VIP support',
            'Access to premium models',
            'Dedicated account manager'
        ]
    }
];

// Get plans with live INR price
export const getPlan = async (req, res) => {
    try {
        const exchangeRate = await getLiveExchangeRate();
        const plansWithINR = plans.map(plan => ({
            ...plan,
            priceINR: Math.round(plan.price * exchangeRate)
        }));
        res.json({ success: true, plans: plansWithINR, exchangeRate });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Purchase plan
export const purchasePlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user._id;
        const plan = plans.find(plan => plan._id === planId);

        if (!plan) {
            return res.json({ success: false, message: "Invalid plan" });
        }

        const exchangeRate = await getLiveExchangeRate();
        const priceINR = Math.round(plan.price * exchangeRate);

        // Create transaction
        const transaction = await Transaction.create({
            userId: userId,
            planId: plan._id,
            amount: plan.price,
            credits: plan.credits,
            status: false
        });

        const { origin } = req.headers;
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        unit_amount: priceINR * 100,
                        product_data: {
                            name: `QuickGPT ${plan.name} Plan`,
                            description: `${plan.credits} credits`
                        }
                    },
                    quantity: 1
                },
            ],
            mode: 'payment',
            success_url: `${origin}/loading?transactionId=${transaction._id}`,
            cancel_url: `${origin}/credits`,
            metadata: { transactionId: transaction._id.toString() },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
        });

        res.json({ success: true, url: session.url });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// New route — verify payment and add credits directly
export const verifyPayment = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const userId = req.user._id;

        // Find transaction
        const transaction = await Transaction.findOne({
            _id: transactionId,
            userId: userId,
            status: false
        });

        if (!transaction) {
            return res.json({ success: false, message: "Transaction not found or already processed" });
        }

        // Add credits directly to user
        await User.updateOne(
            { _id: userId },
            { $inc: { credits: transaction.credits } }
        );

        // Mark transaction as paid
        transaction.status = true;
        await transaction.save();

        console.log(`✅ Credits added: ${transaction.credits} for user: ${userId}`);
        res.json({ success: true, credits: transaction.credits });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};