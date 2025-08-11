// server.js
import express from 'express';

const app = express();
const PORT = 3000;

// Utility function to generate random text
function getRandomText() {
  const texts = [
    "Hello, world!",
    "This is a random text.",
    "Node.js is awesome!",
    "Express makes server easy.",
    "Have a great day!",
    "Random text here.",
  ];
  const index = Math.floor(Math.random() * texts.length);
  return texts[index];
}

app.get('/test', (req, res) => {
  res.json({ message: getRandomText() });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
