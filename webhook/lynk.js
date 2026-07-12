import crypto from "crypto";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            message: "Method Not Allowed"
        });
    }

    const signature = req.headers["x-lynk-signature"];

    const body = req.body;

    const refId = body.data.message_data.refId;

    const amount = String(body.data.message_data.totals.grandTotal);

    const messageId = body.data.message_id;

    const secretKey = process.env.LYNK_MERCHANT_KEY;

    const hash = crypto
        .createHash("sha256")
        .update(amount + refId + messageId + secretKey)
        .digest("hex");

    if (hash !== signature) {
        return res.status(401).json({
            success: false,
            message: "Invalid Signature"
        });
    }

    console.log(body);

    return res.status(200).json({
        success: true
    });

}