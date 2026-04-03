import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { response } from "express";

export const stripeWebhooks = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event  = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
        return response.status(400).send(`Webhook Error: ${error.message}`)
    }

    try {
        switch(event.type) {
            case "payment_intent.succeeded":{
                const paymentIntent = event.data.object;
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                })
                 const session = sessionList.data[0];
                 const {transactionId, appId}  = session.metadata;

                 if(appId === 'quickchat'){
                    const transaction = await Transaction.findOne({_id: transactionId, ispaid: false});

                    // Update credits in user account
                    await User.updateOne({_id: transaction.userId}, {$inc: {credits: transaction.credits}})

                    // Update credit payment status
                    transaction.ispaid = true;
                    await transaction.save();
                 } else {
                    return response.json({received: true, message: "Ignored Event: Invalid App ID"})
                 }
                  break;
            }
               
            default:
                console.log("unhandled event type: ", event.type)
                break;
        }
        response.json({received: true})
    } catch (error) {
        console.error("Webhook Processing Error: ", error)
        response.status(500).send("Internal Server Error")
    }
}


