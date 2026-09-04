const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

data.entities.User.properties.subscriptionStatus = { "type": "string", "enum": ["trial", "active", "past_due", "canceled"] };
data.entities.User.properties.trialEndsAt = { "type": "string" };
data.entities.User.properties.stripeCustomerId = { "type": "string" };

data.entities.Transaction = {
  title: "Payment Transaction",
  description: "User payment history",
  type: "object",
  properties: {
    id: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string" },
    status: { type: "string", enum: ["succeeded", "pending", "failed"] },
    method: { type: "string", enum: ["card", "pix", "paypal"] },
    createdAt: { type: "string" }
  },
  required: ["id", "amount", "status", "method"]
};

data.firestore["/users/{userId}/transactions/{transactionId}"] = {
  schema: { $ref: "#/entities/Transaction" },
  description: "User payment transactions"
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(data, null, 2));
