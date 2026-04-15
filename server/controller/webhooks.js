import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const stripeWebhooks = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature error:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {

            // ✅ Fixed: checkout.session.completed is more reliable than payment_intent.succeeded
            case "checkout.session.completed": {
                const session = event.data.object;
                const { transactionId } = session.metadata;

                if (!transactionId) {
                    console.log("No transactionId in metadata");
                    break;
                }

                // ✅ Find unpaid transaction
                const transaction = await Transaction.findOne({
                    _id: transactionId,
                    status: false
                });

                if (transaction) {
                    // ✅ Add credits to user
                    await User.updateOne(
                        { _id: transaction.userId },
                        { $inc: { credits: transaction.credits } }
                    );

                    // ✅ Mark transaction as paid
                    transaction.status = true;
                    await transaction.save();

                    console.log(`✅ Credits added for transaction: ${transactionId}`);
                } else {
                    console.log("Transaction not found or already paid");
                }
                break;
            }

            default:
                console.log("Unhandled event type:", event.type);
                break;
        }

        res.json({ received: true });

    } catch (error) {
        console.error("Webhook Processing Error:", error);
        res.status(500).send("Internal Server Error");
    }
}