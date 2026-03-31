
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const Razorpay = require("razorpay");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Set global options for all functions
setGlobalOptions({ region: "asia-south1", maxInstances: 2 });

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Initialize Razorpay client from environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * API 1: Create a single-use dynamic QR code for ₹1 for a specific user and method.
 */
app.post("/create-qr", async (req, res) => {
    const { userId, methodName } = req.body;

    if (!userId || !methodName) {
        return res.status(400).send("userId and methodName are required.");
    }

    try {
        const closeBy = Math.floor(Date.now() / 1000) + 600; // 10 minutes from now

        const options = {
            type: "upi_qr",
            name: "Secure ₹1 Verification",
            usage: "single_use",
            fixed_amount: true,
            payment_amount: 100, // 100 paise = ₹1
            currency: "INR",
            description: `Verification for ${methodName}`,
            close_by: closeBy,
            notes: {
                purpose: "verification",
                userId: userId,
                methodName: methodName,
            }
        };

        const qrCode = await razorpay.qrCode.create(options);

        // Store the QR ID in Firestore to track its status
        await db.collection("qr_payments").doc(qrCode.id).set({
            id: qrCode.id,
            status: qrCode.status,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            paid: false,
            userId: userId,
            methodName: methodName,
        });

        res.status(200).json({
            qr_id: qrCode.id,
            image_url: qrCode.image_url,
            status: qrCode.status
        });

    } catch (error) {
        console.error("Error creating Razorpay QR code:", error);
        res.status(500).send("Failed to create QR code.");
    }
});


/**
 * API 2: Verify payment status by polling Firestore.
 */
app.get("/verify-payment", async (req, res) => {
    const qrId = req.query.qr_id;
    if (!qrId) {
        return res.status(400).send("QR ID is required.");
    }

    try {
        const docRef = db.collection("qr_payments").doc(qrId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send("QR record not found.");
        }

        res.status(200).json(doc.data());

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).send("Failed to verify payment status.");
    }
});

/**
 * Webhook: Handles events from Razorpay.
 */
app.post("/razorpay-webhook", (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    try {
        const shasum = crypto.createHmac("sha256", secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if (digest !== signature) {
            console.warn("Webhook signature mismatch.");
            return res.status(400).send("Invalid signature.");
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === "qr_code.credited") {
            const qrEntity = payload.qr_code.entity;
            const paymentEntity = payload.payment.entity;

            const qrId = qrEntity.id;
            const docRef = db.collection("qr_payments").doc(qrId);

            db.runTransaction(async (transaction) => {
                const qrDoc = await transaction.get(docRef);
                if (!qrDoc.exists) {
                    throw new Error(`QR payment record not found for ID: ${qrId}`);
                }

                const { userId, methodName } = qrDoc.data();
                const payerVpa = paymentEntity.vpa;

                if (!userId || !methodName || !payerVpa) {
                    console.warn(`Missing userId, methodName, or VPA for QR ID: ${qrId}. Cannot link UPI.`);
                } else {
                    const userRef = db.collection('users').doc(userId);
                    const userDoc = await transaction.get(userRef);
                    if (userDoc.exists) {
                        const currentMethods = userDoc.data().paymentMethods || [];
                        const newMethod = { name: methodName, upiId: payerVpa, type: 'upi' };
                        const isDuplicate = currentMethods.some((pm) => pm.upiId === payerVpa);

                        if (!isDuplicate) {
                            transaction.update(userRef, {
                                paymentMethods: admin.firestore.FieldValue.arrayUnion(newMethod),
                            });
                        }
                    } else {
                         console.error(`User profile not found for userId: ${userId}. Cannot link UPI.`);
                    }
                }

                // Update the qr_payments document
                const paymentData = {
                    paid: true,
                    status: 'credited',
                    payer_vpa: payerVpa,
                    razorpay_payment_id: paymentEntity.id,
                    paid_at: admin.firestore.Timestamp.fromMillis(paymentEntity.created_at * 1000),
                    amount: paymentEntity.amount / 100,
                };
                transaction.update(docRef, paymentData);
            }).then(() => {
                console.log(`Successfully processed payment and linked UPI for QR ID: ${qrId}`);
            }).catch(error => {
                console.error(`Transaction failed for QR ID ${qrId}:`, error);
            });
        }
        
        res.status(200).json({ status: "ok" });

    } catch (error) {
        console.error("Error in webhook processing:", error);
        res.status(500).send("Webhook processing error.");
    }
});


// Expose Express API as a single Cloud Function
exports.api = onRequest(app);
