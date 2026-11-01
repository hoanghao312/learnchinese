const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const grammarTarget = `const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    if (response.text) {
      return res.json({ analysis: response.text });
    } else {
      return res.status(500).json({ error: "Could not analyze text." });
    }`;

const grammarReplacement = `res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    for await (const chunk of responseStream) {
      res.write(chunk.text);
    }
    return res.end();`;

content = content.replace(grammarTarget, grammarReplacement);


const translateTarget = `const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.3
        }
      });
      if (response.text) {
        return res.json({ translation: response.text });
      } else {
        return res.status(500).json({ error: "Could not translate text." });
      }`;

const translateReplacement = `res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.3
        }
      });

      for await (const chunk of responseStream) {
        res.write(chunk.text);
      }
      return res.end();`;

content = content.replace(translateTarget, translateReplacement);

fs.writeFileSync('server.ts', content);
