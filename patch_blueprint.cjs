const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));
data.entities.AudienceMember = {
  title: "Audience Member",
  description: "End users (audience) engaging with the stream",
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    avatar: { type: "string" },
    isNewUser: { type: "boolean" },
    engagementScore: { type: "number" },
    firstSeen: { type: "string" },
    lastSeen: { type: "string" }
  },
  required: ["id", "name"]
};
data.firestore["/users/{userId}/audience/{memberId}"] = {
  schema: { $ref: "#/entities/AudienceMember" },
  description: "Audience members / CRM for the studio user"
};
fs.writeFileSync('firebase-blueprint.json', JSON.stringify(data, null, 2));
