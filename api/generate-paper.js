function getBoardName(classNum) {
  if (classNum <= 4) return "পশ্চিমবঙ্গ প্রাথমিক শিক্ষা পর্ষদ (WBBPE)";
  if (classNum <= 10) return "পশ্চিমবঙ্গ মধ্যশিক্ষা পর্ষদ (WBBSE)";
  return "পশ্চিমবঙ্গ উচ্চমাধ্যমিক শিক্ষা সংসদ (WBCHSE)";
}

async function callGeminiWithAutoModel(apiKey, payload) {
  // Priority list of official Gemini model IDs
  const candidateModels = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
  ];

  // 1. Try candidate models in order
  for (const modelName of candidateModels) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (res.ok) {
      return data;
    }

    const errMsg = data?.error?.message || "";
    // If the error is NOT about the model name/availability, stop and throw it
    if (
      res.status !== 404 &&
      !errMsg.includes("not found") &&
      !errMsg.includes("no longer available") &&
      !errMsg.includes("not supported")
    ) {
      throw new Error(errMsg || "Gemini API Error");
    }
  }

  // 2. Fallback: Ask Google's ListModels API for an available model on this key
  const listRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const listData = await listRes.json();

  const availableModel = (listData.models || []).find(
    (m) =>
      m.name.includes("gemini") &&
      (m.supportedGenerationMethods || []).includes("generateContent") &&
      !m.name.includes("2.0") &&
      !m.name.includes("1.5")
  );

  if (!availableModel) {
    throw new Error("কোনো সক্রিয় Gemini মডেল পাওয়া যায়নি।");
  }

  const finalRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${availableModel.name}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const finalData = await finalRes.json();
  if (!finalRes.ok) {
    throw new Error(finalData?.error?.message || "Gemini API Error");
  }
  return finalData;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.Gemini_API_Key ||
    "AIzaSyBw5HOOTsbRZdYIyygB7THOpMnUajdmAcI";

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const {
      selectedClass = 10,
      subject = "ভৌতবিজ্ঞান",
      topics = "আলো",
      fullMarks = 40,
      mcqCount = 10,
      fillBlanksCount = 10,
      longQCount = 4,
      longQMarksEach = 5,
    } = body;

    const boardName = getBoardName(Number(selectedClass));

    const prompt = `
You are an expert West Bengal Board question paper setter.
Create a complete, authentic question paper strictly in the BENGALI language (বাংলা লিপি) following the syllabus and standard of ${boardName}.

Details:
- Class: Class ${selectedClass}
- Subject: ${subject}
- Topics / Chapters to cover: ${topics}
- Total Full Marks: ${fullMarks}
- Section A (MCQ): Generate exactly ${mcqCount} questions (1 mark each). Each must have 4 options in Bengali.
- Section B (Fill in the Blanks): Generate exactly ${fillBlanksCount} questions (1 mark each) containing "________".
- Section C (Long / Descriptive Questions): Generate exactly ${longQCount} questions (${longQMarksEach} marks each). Include an alternative question ('orQuestion') where appropriate.

Match the exact terminology of West Bengal Board textbooks for Class ${selectedClass}. Use Bengali numerals for marks and time.
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            boardHeader: { type: "STRING" },
            classNameBengali: { type: "STRING" },
            subjectBengali: { type: "STRING" },
            fullMarksBengali: { type: "STRING" },
            timeAllowedBengali: { type: "STRING" },
            mcqs: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  options: { type: "ARRAY", items: { type: "STRING" } },
                  answer: { type: "STRING" },
                },
                required: ["question", "options", "answer"],
              },
            },
            fillInTheBlanks: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  answer: { type: "STRING" },
                },
                required: ["question", "answer"],
              },
            },
            longQuestions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  question: { type: "STRING" },
                  orQuestion: { type: "STRING" },
                  marks: { type: "NUMBER" },
                  answerHint: { type: "STRING" },
                },
                required: ["question", "marks", "answerHint"],
              },
            },
          },
          required: [
            "boardHeader",
            "classNameBengali",
            "subjectBengali",
            "fullMarksBengali",
            "timeAllowedBengali",
            "mcqs",
            "fillInTheBlanks",
            "longQuestions",
          ],
        },
      },
    };

    const result = await callGeminiWithAutoModel(apiKey, payload);

    let rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("AI থেকে কোনো উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।");
    }

    // Clean markdown code fences if present
    rawText = rawText.replace(/```json|```/g, "").trim();

    const paperData = JSON.parse(rawText);
    return res.status(200).json(paperData);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "প্রশ্নপত্র তৈরি করতে সমস্যা হয়েছে।",
    });
  }
};
