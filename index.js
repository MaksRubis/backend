const fs = require("fs");
const express = require("express");
const app = express();
app.use(express.json());

const WORKINK_API_KEY = process.env.WORKINK_API_KEY;

// читаем один раз при старте сервера, а не на каждый запрос
const MAIN_SCRIPT = fs.readFileSync("/etc/secrets/main.lua", "utf8");

app.post("/verify", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ valid: false });

  try {
    const r = await fetch(
      `https://work.ink/_api/v2/token/verify/${key}`,
      { headers: { "X-Api-Key": WORKINK_API_KEY } }
    );

    if (r.status === 401 || r.status === 403) {
      console.error("Ошибка конфигурации work.ink:", r.status);
      return res.status(500).json({ valid: false });
    }

    const data = await r.json();

    if (data.info?.likely_bypassed === true) {
      console.log(`Возможный обход у ключа ${key}`);
    }

    if (!data.valid) return res.json({ valid: false });

    return res.json({ valid: true, script: MAIN_SCRIPT });
  } catch (e) {
    console.error(e);
    res.status(500).json({ valid: false });
  }
});

app.listen(process.env.PORT || 3000);
