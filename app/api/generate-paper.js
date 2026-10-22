function getBoardName(classNum) {
  if (classNum <= 4) return "পশ্চিমবঙ্গ প্রাথমিক শিক্ষা পর্ষদ (WBBPE)";
  if (classNum <= 10) return "পশ্চিমবঙ্গ মধ্যশিক্ষা পর্ষদ (WBBSE)";
  return "পশ্চিমবঙ্গ উচ্চমাধ্যমিক শিক্ষা সংসদ (WBCHSE)";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY পাওয়া যায়নি। Vercel Settings -> Environment Variables-এ গিয়ে GEMINI_API_KEY যোগ করুন।",
    });
  }

  try {
    const {
      selectedClass,
      subject,
      topics,
      fullMarks,
      mcqCount,
      fillBlanksCount,
      longQCount,
      longQMarksEach,
    } = req.body || {};

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Gemini API Error");
    }

    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("AI থেকে কোনো উত্তর পাওয়া যায়নি। আবার চেষ্টা করুন।");
    }

    const paperData = JSON.parse(rawText);
    return res.status(200).json(paperData);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "প্রশ্নপত্র তৈরি করতে সমস্যা হয়েছে।",
    });
  }
};
