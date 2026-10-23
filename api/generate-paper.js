function getBoardDetails(classNum) {
  if (classNum <= 4) {
    return {
      board: "পশ্চিমবঙ্গ প্রাথমিক শিক্ষা পর্ষদ (WBBPE)",
      books: "পাতাবাহার, আমার গণিত, আমাদের পরিবেশ (২০২৬ সালের বর্তমান সিলেবাস)",
    };
  }
  if (classNum <= 10) {
    return {
      board: "পশ্চিমবঙ্গ মধ্যশিক্ষা পর্ষদ (WBBSE)",
      books:
        "সাহিত্য মেলা / সাহিত্য সঞ্চয়ন, গণিত প্রকাশ, পরিবেশ ও বিজ্ঞান, ভৌতবিজ্ঞান, জীবনবিজ্ঞান, অতীত ও ঐতিহ্য (ইতিহাস), আমাদের পৃথিবী / ভারত ও পৃথিবী (ভূগোল) — ২০২৬ সালের মধ্যশিক্ষা পর্ষদের বর্তমান সিলেবাস",
    };
  }
  return {
    board: "পশ্চিমবঙ্গ উচ্চমাধ্যমিক শিক্ষা সংসদ (WBCHSE)",
    books:
      "WBCHSE ২০২৬ সালের নতুন উচ্চমাধ্যমিক সিলেবাস ও সেমিস্টার/বার্ষিক পাঠ্যক্রম",
  };
}

async function callGeminiWithAutoModel(apiKey, payload) {
  const candidateModels = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
  ];

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
    if (
      res.status !== 404 &&
      !errMsg.includes("not found") &&
      !errMsg.includes("no longer available") &&
      !errMsg.includes("not supported")
    ) {
      throw new Error(errMsg || "Gemini API Error");
    }
  }

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
      examTitle = "বার্ষিক মূল্যায়ন - ২০২৬",
      topics = "২০২৬ সালের সিলেবাস অনুযায়ী",
      fullMarks = 40,
      mcqCount = 10,
      fillBlanksCount = 10,
      longQCount = 4,
      longQMarksEach = 5,
    } = body;

    const { board, books } = getBoardDetails(Number(selectedClass));

    const prompt = `
You are an expert West Bengal Board teacher and question paper setter for the current academic year 2026.
Create a complete, authentic question paper strictly in the BENGALI language (বাংলা লিপি) following the LATEST 2026 official syllabus of ${board}.

 Official Textbook & Syllabus Reference:
- Standard Textbooks to follow: ${books}
- Class: Class ${selectedClass}
- Subject: ${subject}
- Exam Term / Evaluation: ${examTitle}
- Topics / Chapters to cover: ${topics} (If the user specified "২০২৬ সালের সিলেবাস অনুযায়ী" or left it general, automatically select the exact chapters prescribed in the 2026 ${board} syllabus for Class ${selectedClass} ${subject} under ${examTitle}).

Question Paper Structure (Total Marks: ${fullMarks}):
- Section A (MCQ - সঠিক উত্তরটি নির্বাচন করো): Generate exactly ${mcqCount} questions (1 mark each). Each question must have 4 realistic options in Bengali.
- Section B (Fill in the Blanks - শূন্যস্থান পূরণ করো): Generate exactly ${fillBlanksCount} questions (1 mark each) containing "________".
- Section C (Long / Descriptive Questions - রচনামূলক প্রশ্ন): Generate exactly ${longQCount} questions (${longQMarksEach} marks each). Include an internal choice ('orQuestion') from the 2026 syllabus where appropriate.

Strict Guidelines:
1. Do NOT ask out-of-syllabus questions. Stick 100% to the current 2026 West Bengal government school curriculum for Class ${selectedClass}.
2. Use authentic Bengali terminology as printed in West Bengal Board textbooks.
3. Use Bengali digits (০-৯) for fullMarksBengali and timeAllowedBengali.
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
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

    rawText = rawText.replace(/```json|```/g, "").trim();

    const paperData = JSON.parse(rawText);
    return res.status(200).json(paperData);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "প্রশ্নপত্র তৈরি করতে সমস্যা হয়েছে।",
    });
  }
};
