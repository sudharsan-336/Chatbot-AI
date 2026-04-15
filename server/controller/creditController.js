import Transaction from "../models/Transaction.js";
import Stripe from "stripe";

const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 10,
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
        price: 20,
        credits: 500,
        features: [
            '500 text or image generations', // ✅ Fixed
            'Priority support',
            'Access to pro models',
            'Faster response time'
        ]
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: [
            '1000 text or image generations', // ✅ Fixed
            '24/7 VIP support',
            'Access to premium models',
            'Dedicated account manager'
        ]
    }
];

// API Controller to get all subscription plans
export const getPlan = async (req, res) => {
    try {
        res.json({ success: true, plans })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// API Controller to purchase a subscription plan
export const purchasePlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user._id;
        const plan = plans.find(plan => plan._id === planId);

        if (!plan) {
            return res.json({ success: false, message: "Invalid plan" })
        }

        // ✅ Fixed: status should be boolean false not string "false"
        const transaction = await Transaction.create({
            userId: userId,
            planId: plan._id,
            amount: plan.price,
            credits: plan.credits,
            status: false // ✅ boolean
        })

        const { origin } = req.headers;
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        unit_amount: plan.price * 100,
                        product_data: {
                            name: plan.name
                        }
                    },
                    quantity: 1
                },
            ],
            mode: 'payment',
            success_url: `${origin}/loading`,
            cancel_url: `${origin}`,
            metadata: { transactionId: transaction._id.toString() },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
        });

        res.json({ success: true, url: session.url })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}