import crypto from 'crypto';

export function verifySignature(body, signature){
 const refId=body.data.message_data.refId;
 const amount=String(body.data.message_data.totals.grandTotal);
 const messageId=body.data.message_id;
 const merchantKey=process.env.LYNK_MERCHANT_KEY;
 const hash=crypto.createHash('sha256').update(amount+refId+messageId+merchantKey).digest('hex');
 return hash===signature;
}
