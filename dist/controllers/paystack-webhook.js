import crypto from "crypto";
import db from "../libs/db.js";
export const paystackWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-paystack-signature"];
        // FIXED: req.body is already a Buffer from express.raw()
        // Don't stringify it, just pass it directly
        const hash = crypto
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
            .update(req.body) // ✅ Use raw buffer directly
            .digest("hex");
        console.log("🔐 Signature match:", hash === signature);
        if (hash !== signature) {
            console.error("❌ Invalid signature");
            return res.sendStatus(401);
        }
        // FIXED: Parse the buffer to JSON manually
        const event = JSON.parse(req.body.toString()); // ✅ Convert buffer to string then parse
        console.log("📩 Webhook event:", event, event.data);
        if (event.event === "charge.success") {
            const { reference, metadata, amount, channel } = event.data;
            console.log("✅ Payment successful:", reference);
            // Idempotency check
            const existing = await db.payment.findUnique({ where: { reference } });
            if (existing) {
                console.log("⚠️ Payment already processed");
                return res.sendStatus(200);
            }
            // Validate amount (IMPORTANT!)
            const VERIFICATION_AMOUNT = 2000 * 100; // ₦2000 in kobo
            if (amount !== VERIFICATION_AMOUNT) {
                console.error("❌ Amount mismatch:", amount);
                return res.sendStatus(400);
            }
            // Save payment and update user in transaction
            await db.$transaction([
                db.payment.create({
                    data: {
                        reference,
                        userId: Number(metadata.userId),
                        amount: amount / 100, // Store in Naira
                        status: "SUCCESS",
                        channel,
                    },
                }),
                db.user.update({
                    where: { publicId: metadata.publicId },
                    data: {
                        verifiedSeller: true,
                    },
                }),
            ]);
            console.log(`🎉 Verification badge awarded to: ${metadata.publicId}`);
        }
        res.sendStatus(200);
    }
    catch (error) {
        console.error("❌ Webhook error:", error.message);
        res.sendStatus(400);
    }
};
