"use client";

import React, { useState } from "react";

const WB_SUBJECTS = [
  "বাংলা (Bengali)",
  "গণিত (Mathematics)",
  "পরিবেশ ও বিজ্ঞান (Environment & Science)",
  "ভৌতবিজ্ঞান (Physical Science)",
  "জীবনবিজ্ঞান (Life Science)",
  "ইতিহাস (History)",
  "ভূগোল (Geography)",
  "আমাদের পরিবেশ (Amader Paribesh - Primary)",
  "পদার্থবিদ্যা (Physics - XI/XII)",
  "রসায়ন (Chemistry - XI/XII)",
  "জীববিদ্যা (Biology - XI/XII)",
  "রাষ্ট্রবিজ্ঞান (Political Science)",
  "দর্শন (Philosophy)",
  "শিক্ষাবিজ্ঞান (Education)",
  "হিসাবশাস্ত্র (Accountancy)",
  "কারবারি শিক্ষা (Business Studies)",
  "অর্থনীতি (Economics)",
  "কম্পিউটার অ্যাপ্লিকেশন (Computer Application)",
];

const toBengaliDigits = (num: number | string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

const BENGALI_OPTION_LABELS = ["ক", "খ", "গ", "ঘ"];

export default function QuestionPaperGenerator() {
  const [selectedClass, setSelectedClass] = useState<number>(10);
  const [subject, setSubject] = useState<string>(WB_SUBJECTS[3]);
  const [topics, setTopics] = useState<string>("আলো, চলতড়িৎ, পর্যায় সারণি");
  const [fullMarks, setFullMarks] = useState<number>(40);
  const [mcqCount, setMcqCount] = useState<number>(10);
  const [fillBlanksCount, setFillBlanksCount] = useState<number>(10);
  const [longQCount, setLongQCount] = useState<number>(4);
  const [longQMarksEach, setLongQMarksEach] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<any>(null);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  // Calculate allocated marks
  const calculatedMarks =
    mcqCount * 1 + fillBlanksCount * 1 + longQCount * longQMarksEach;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedClass,
          subject,
          topics,
          fullMarks,
          mcqCount,
          fillBlanksCount,
          longQCount,
          longQMarksEach,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate paper");
      setPaper(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Control Panel (Hidden during Print/PDF export) */}
      <div className="max-w-4xl mx-auto print:hidden mb-10">
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-950">
              পশ্চিমবঙ্গ পর্ষদ প্রশ্নপত্র নির্মাতা (Class 1–12)
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              WBBPE, WBBSE এবং WBCHSE সিলেবাস অনুযায়ী বাংলায় প্রশ্নপত্র তৈরি করুন
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Class Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  শ্রেণি নির্বাচন করুন (Class 1 - 12)
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                    <option key={cls} value={cls}>
                      Class {cls} ({toBengaliDigits(cls)}ম শ্রেণি)
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  বিষয় (Subject)
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                >
                  {WB_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topics / Chapters Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                অধ্যায় বা বিষয়বস্তু (Topics / Chapters)
              </label>
              <textarea
                rows={2}
                required
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="যেমন: আলো, চলতড়িৎ, পর্যায় সারণি (কমা দিয়ে লিখুন)"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              />
            </div>

            {/* Marks & Question Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পূর্ণমান (Full Marks)
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={fullMarks}
                  onChange={(e) => setFullMarks(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MCQ সংখ্যা (×১)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শূন্যস্থান সংখ্যা (×১)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={fillBlanksCount}
                  onChange={(e) => setFillBlanksCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বড় প্রশ্নের সংখ্যা
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={longQCount}
                  onChange={(e) => setLongQCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতিটি বড় প্রশ্নের মান
                </label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={longQMarksEach}
                  onChange={(e) => setLongQMarksEach(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            {/* Live Marks Tally Banner */}
            <div
              className={`p-3 rounded-lg text-sm flex items-center justify-between ${
                calculatedMarks === fullMarks
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <span>
                প্রশ্নের মোট নম্বর হিসাব:{" "}
                <strong>
                  ({toBengaliDigits(mcqCount)}×১) + ({toBengaliDigits(fillBlanksCount)}×১) + (
                  {toBengaliDigits(longQCount)}×{toBengaliDigits(longQMarksEach)}) ={" "}
                  {toBengaliDigits(calculatedMarks)}
                </strong>
              </span>
              {calculatedMarks !== fullMarks && (
                <button
                  type="button"
                  onClick={() => setFullMarks(calculatedMarks)}
                  className="text-xs font-semibold underline hover:text-amber-950"
                >
                  পূর্ণমান {toBengaliDigits(calculatedMarks)} সেট করুন
                </button>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition cursor-pointer"
              >
                {loading
                  ? "প্রশ্নপত্র তৈরি হচ্ছে..."
                  : "প্রশ্নপত্র তৈরি করুন (Generate Paper)"}
              </button>

              {paper && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAnswers(!showAnswers)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium"
                  >
                    {showAnswers ? "উত্তর লুকান (Hide Answers)" : "উত্তরপত্র দেখুন (Answer Key)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
                  >
                    প্রিন্ট / PDF ডাউনলোড
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Generated Question Paper Sheet */}
      {paper && (
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none border border-slate-200 print:border-none p-8 sm:p-12 rounded-xl">
          {/* Exam Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-wide">
              {paper.boardHeader}
            </h2>
            <p className="text-lg font-semibold mt-1">
              শ্রেণি: {paper.classNameBengali} | বিষয়: {paper.subjectBengali}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              অধ্যায়: {topics}
            </p>
            <div className="flex justify-between items-center mt-4 text-sm sm:text-base font-semibold">
              <span>সময়: {paper.timeAllowedBengali}</span>
              <span>পূর্ণমান: {toBengaliDigits(fullMarks)}</span>
            </div>
          </div>

          {/* Section A: MCQs */}
          {paper.mcqs?.length > 0 && (
            <section className="mb-8">
              <div className="flex justify-between items-baseline font-bold text-base sm:text-lg mb-4 border-b border-slate-300 pb-1">
                <h3>১। সঠিক উত্তরটি নির্বাচন করে লেখো (MCQ):</h3>
                <span>
                  ১ × {toBengaliDigits(paper.mcqs.length)} ={" "}
                  {toBengaliDigits(paper.mcqs.length)}
                </span>
              </div>
              <ol className="space-y-4">
                {paper.mcqs.map((item: any, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    <div className="font-medium">
                      ১.{toBengaliDigits(idx + 1)} {item.question}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5 pl-4 text-sm sm:text-base">
                      {item.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx}>
                          ({BENGALI_OPTION_LABELS[oIdx]}) {opt}
                        </div>
                      ))}
                    </div>
                    {showAnswers && (
                      <div className="mt-1 pl-4 text-xs font-semibold text-emerald-700">
                        উত্তর: {item.answer}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Section B: Fill in the Blanks */}
          {paper.fillInTheBlanks?.length > 0 && (
            <section className="mb-8">
              <div className="flex justify-between items-baseline font-bold text-base sm:text-lg mb-4 border-b border-slate-300 pb-1">
                <h3>২। উপযুক্ত শব্দ বসিয়ে শূন্যস্থান পূরণ করো:</h3>
                <span>
                  ১ × {toBengaliDigits(paper.fillInTheBlanks.length)} ={" "}
                  {toBengaliDigits(paper.fillInTheBlanks.length)}
                </span>
              </div>
              <ol className="space-y-3">
                {paper.fillInTheBlanks.map((item: any, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    <div>
                      ২.{toBengaliDigits(idx + 1)} {item.question}
                    </div>
                    {showAnswers && (
                      <div className="mt-0.5 pl-4 text-xs font-semibold text-emerald-700">
                        উত্তর: {item.answer}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Section C: Long Questions */}
          {paper.longQuestions?.length > 0 && (
            <section className="mb-6">
              <div className="flex justify-between items-baseline font-bold text-base sm:text-lg mb-4 border-b border-slate-300 pb-1">
                <h3>৩। নিম্নলিখিত প্রশ্নগুলির বিস্তারিত উত্তর দাও:</h3>
                <span>
                  {toBengaliDigits(longQMarksEach)} ×{" "}
                  {toBengaliDigits(paper.longQuestions.length)} ={" "}
                  {toBengaliDigits(longQMarksEach * paper.longQuestions.length)}
                </span>
              </div>
              <ol className="space-y-4">
                {paper.longQuestions.map((item: any, idx: number) => (
                  <li key={idx} className="leading-relaxed">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="font-medium">
                          ৩.{toBengaliDigits(idx + 1)} {item.question}
                        </span>
                        {item.orQuestion && (
                          <div className="mt-1 pl-6 text-slate-800">
                            <span className="font-bold italic mr-2">[অথবা]</span>
                            {item.orQuestion}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        [{toBengaliDigits(item.marks)}]
                      </span>
                    </div>
                    {showAnswers && (
                      <div className="mt-1 pl-4 text-xs font-semibold text-emerald-700">
                        উত্তর সংকেত: {item.answerHint}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
