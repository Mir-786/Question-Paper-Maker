import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function getBoardName(classNum: number): string {
  if (classNum <= 4) return "পশ্চিমবঙ্গ প্রাথমিক শিক্ষা পর্ষদ (WBBPE)";
  if (classNum <= 10) return "পশ্চিমবঙ্গ মধ্যশিক্ষা পর্ষদ (WBBSE)";
  return "পশ্চিমবঙ্গ উচ্চমাধ্যমিক শিক্ষা সংসদ (WBCHSE)";
}

const paperSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    boardHeader: { type: Type.STRING, description: "Board name in Bengali" },
    classNameBengali: { type: Type.STRING, description: "Class name in Bengali, e.g., দশম শ্রেণি" },
    subjectBengali: { type: Type.STRING, description: "Subject name in Bengali" },
    fullMarksBengali: { type: Type.STRING, description: "Full marks in Bengali digits, e.g., ৫০" },
    timeAllowedBengali: { type: Type.STRING, description: "Recommended exam duration in Bengali, e.g., ১ ঘণ্টা ৩০ মিনিট" },
    mcqs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 options in Bengali",
          },
          answer: { type: Type.STRING, description: "Correct option text" },
        },
        required: ["question", "options", "answer"],
      },
    },
    fillInTheBlanks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "Sentence in Bengali with ________ for the blank",
          },
          answer: { type: Type.STRING, description: "Correct word for the blank" },
        },
        required: ["question", "answer"],
      },
    },
    longQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Main descriptive question in Bengali" },
          orQuestion: {
            type: Type.STRING,
            description: "Optional alternative question ('অথবা') from the same topic",
          },
          marks: { type: Type.NUMBER },
          answerHint: { type: Type.STRING, description: "Brief key points for the answer in Bengali" },
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
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      selectedClass,
      subject,
      topics,
      fullMarks,
      mcqCount,
      fillBlanksCount,
      longQCount,
      longQMarksEach,
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
- Section A (MCQ - সঠিক উত্তরটি নির্বাচন করো): Generate exactly ${mcqCount} questions (1 mark each). Each must have 4 options.
- Section B (Fill in the Blanks - শূন্যস্থান পূরণ করো): Generate exactly ${fillBlanksCount} questions (1 mark each) containing "________".
- Section C (Long / Descriptive Questions - রচনামূলক প্রশ্ন): Generate exactly ${longQCount} questions (${longQMarksEach} marks each). Include an internal choice ('orQuestion') for long questions where appropriate.

Ensure the difficulty level, terminology, and phrasing strictly match West Bengal Board textbooks (e.g., Sahitya Sanchayan, Ganit Prakash, Paribesh O Bigyan, etc.) for Class ${selectedClass}. Use Bengali numerals where requested in the schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: paperSchema,
        temperature: 0.4,
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI model");
    }

    const paperData = JSON.parse(response.text);
    return NextResponse.json(paperData);
  } catch (error: any) {
    console.error("Question Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "প্রশ্নপত্র তৈরি করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
