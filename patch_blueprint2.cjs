const fs = require('fs');
const data = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

delete data.firestore["/webinars/{webinarId}"];
data.firestore["/users/{userId}/webinars/{webinarId}"] = {
  schema: { $ref: "#/entities/Webinar" },
  description: "User webinars collection"
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(data, null, 2));
