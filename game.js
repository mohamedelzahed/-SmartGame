// إعداد المتغيرات العامة
let level = 1;              // المستوى الحالي
let score = 0;              // النقاط
let correctCount = 0;       // عدد الإجابات الصحيحة في المستوى
const targetCorrect = 5;    // عدد الصحيحة للانتقال للمستوى
let currentQuestion = null; // كائن السؤال الحالي
let timerInterval = null;
let timeLeft = 30;

// ربط عناصر الواجهة
const levelSpan = document.getElementById("level");
const scoreSpan = document.getElementById("score");
const correctCountSpan = document.getElementById("correctCount");
const targetCorrectSpan = document.getElementById("targetCorrect");
const questionBox = document.getElementById("questionBox");
const feedbackDiv = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const timerBox = document.getElementById("timerBox");
const timeLeftSpan = document.getElementById("timeLeft");
const endBtn = document.getElementById("endBtn");
const restartBtn = document.getElementById("restartBtn");


targetCorrectSpan.textContent = targetCorrect;

// دوال مساعدة رياضية
function roundTo(value, decimals = 2) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

// توليد أعداد عشوائية في مدى
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// أنواع التحديات حسب المستوى
// المستوى 1: اختيار عامل التحويل الصحيح (بسيط)
// المستوى 2: إدخال الناتج النهائي مع أرقام عشرية
// المستوى 3: تحويلات "متعددة الخطوات" لكن نعرضها في سؤال واحد
// المستوى 4: نفس المستوى 3 مع مؤقت زمني
// المستوى 5: اختبار شامل عشوائي من الأنواع السابقة

// إنشاء سؤال جديد حسب المستوى
function generateQuestion(level) {
  // نختار نوع الوحدات: كتلة أو طول أو زمن
  const categories = ["mass", "length", "time"];
  const cat = categories[randInt(0, categories.length - 1)];

  let baseValue, fromUnit, toUnit, correctAnswer, type, explanation;

  if (cat === "mass") {
    const pairs = [
      ["kg", "g", 1000],
      ["g", "kg", 1 / 1000],
      ["g", "mg", 1000],
      ["kg", "mg", 1000000]
    ];
    const p = pairs[randInt(0, pairs.length - 1)];
    fromUnit = p[0];
    toUnit = p[1];
  } else if (cat === "length") {
    const pairs = [
      ["m", "cm", 100],
      ["cm", "m", 1 / 100],
      ["m", "mm", 1000],
      ["km", "m", 1000],
      ["m", "km", 1 / 1000]
    ];
    const p = pairs[randInt(0, pairs.length - 1)];
    fromUnit = p[0];
    toUnit = p[1];
  } else {
    // time
    const pairs = [
      ["s", "ms", 1000],
      ["ms", "s", 1 / 1000],
      ["min", "s", 60],
      ["h", "min", 60]
    ];
    const p = pairs[randInt(0, pairs.length - 1)];
    fromUnit = p[0];
    toUnit = p[1];
  }

  // قيمة الأساس حسب المستوى
  if (level === 1) {
    baseValue = randInt(1, 20);
  } else if (level === 2) {
    baseValue = randInt(10, 200) / 10; // أعداد عشرية بسيطة
  } else {
    baseValue = randInt(5, 500) / 10;
  }

  // عامل التحويل التقريبي (بدون كسور طويلة)
  let factor;
  if (fromUnit === "kg" && toUnit === "g") factor = 1000;
  else if (fromUnit === "g" && toUnit === "kg") factor = 0.001;
  else if (fromUnit === "g" && toUnit === "mg") factor = 1000;
  else if (fromUnit === "kg" && toUnit === "mg") factor = 1000000;
  else if (fromUnit === "m" && toUnit === "cm") factor = 100;
  else if (fromUnit === "cm" && toUnit === "m") factor = 0.01;
  else if (fromUnit === "m" && toUnit === "mm") factor = 1000;
  else if (fromUnit === "km" && toUnit === "m") factor = 1000;
  else if (fromUnit === "m" && toUnit === "km") factor = 0.001;
  else if (fromUnit === "s" && toUnit === "ms") factor = 1000;
  else if (fromUnit === "ms" && toUnit === "s") factor = 0.001;
  else if (fromUnit === "min" && toUnit === "s") factor = 60;
  else if (fromUnit === "h" && toUnit === "min") factor = 60;
  else factor = 1;

  correctAnswer = baseValue * factor;

  // نحدد نوع التحدي منطقياً حسب المستوى
  if (level === 1) {
    type = "chooseFactor";
  } else if (level === 2) {
    type = "inputResult";
  } else if (level === 3) {
    type = "multiStepInput";
  } else if (level === 4) {
    type = "multiStepInputTimed";
  } else {
    // المستوى 5: عشوائي من 3 أنواع
    const types = ["chooseFactor", "inputResult", "multiStepInput"];
    type = types[randInt(0, types.length - 1)];
  }

  explanation =
    "نحسب القيمة الجديدة باستخدام العلاقة:\n" +
    baseValue + " " + fromUnit +
    " × عامل التحويل (" + factor + ") = " +
    correctAnswer + " " + toUnit;

  return {
    cat,
    baseValue,
    fromUnit,
    toUnit,
    factor,
    correctAnswer,
    type,
    explanation
  };
}

// عرض السؤال في الواجهة
function renderQuestion(q) {
  questionBox.innerHTML = "";
  feedbackDiv.textContent = "";
  feedbackDiv.className = "feedback";
  nextBtn.disabled = true;

  const qText = document.createElement("div");
  qText.className = "question-text";
  qText.textContent = `حوِّل: ${q.baseValue} ${q.fromUnit} = ؟ ${q.toUnit}`;
  questionBox.appendChild(qText);

  if (q.type === "chooseFactor") {
    renderChooseFactor(q);
  } else if (q.type === "inputResult" || q.type === "multiStepInput" || q.type === "multiStepInputTimed") {
    renderInputResult(q);
  }
}

// نمط 1: اختيار عامل التحويل الصحيح (اختيار من متعدد)
function renderChooseFactor(q) {
  const desc = document.createElement("div");
  desc.textContent = "اختر عامل التحويل الصحيح:";
  questionBox.appendChild(desc);

  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options";

  // عامل صحيح + 3 عوامل خاطئة قريبة
  const correct = q.factor;
  const factors = [correct];

  // توليد عوامل خاطئة
  while (factors.length < 4) {
    const delta = [0.1, 10, 100, 0.01][randInt(0, 3)];
    let wrong;
    if (correct >= 1) {
      wrong = correct * (Math.random() < 0.5 ? delta : 1 / delta);
    } else {
      wrong = correct + delta;
    }
    wrong = roundTo(wrong, 4);
    if (!factors.includes(wrong)) factors.push(wrong);
  }

  // خلط العوامل
  factors.sort(() => Math.random() - 0.5);

  factors.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "btn btn-option";
    btn.textContent = f;
    btn.onclick = () => {
      checkChooseFactorAnswer(q, f, btn, optionsDiv);
    };
    optionsDiv.appendChild(btn);
  });

  questionBox.appendChild(optionsDiv);
}

// التحقق من إجابة اختيار العامل
function checkChooseFactorAnswer(q, chosen, btn, optionsDiv) {
  const buttons = optionsDiv.querySelectorAll("button");
  buttons.forEach(b => (b.disabled = true));

  if (Math.abs(chosen - q.factor) < 1e-6) {
    btn.classList.add("correct");
    handleCorrectAnswer(q, "عامل التحويل صحيح.\n" + q.explanation);
  } else {
    btn.classList.add("wrong");
    handleWrongAnswer(q, "عامل التحويل غير صحيح.\n" + q.explanation);
  }
}

// نمط 2 و3 و4: إدخال الناتج النهائي
function renderInputResult(q) {
  const desc = document.createElement("div");
  if (q.type === "multiStepInput" || q.type === "multiStepInputTimed") {
    desc.textContent = "أدخل القيمة النهائية (فكّر في خطوات التحويل المناسبة):";
  } else {
    desc.textContent = "أدخل الناتج النهائي:";
  }
  questionBox.appendChild(desc);

  const inputRow = document.createElement("div");
  inputRow.className = "input-row";

  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.001";
  input.placeholder = "اكتب القيمة هنا";

  const unitLabel = document.createElement("span");
  unitLabel.textContent = q.toUnit;

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn";
  submitBtn.textContent = "تحقق";

  submitBtn.onclick = () => {
    const val = parseFloat(input.value);
    if (isNaN(val)) return;
    checkInputResultAnswer(q, val);
    input.disabled = true;
    submitBtn.disabled = true;
  };

  inputRow.appendChild(input);
  inputRow.appendChild(unitLabel);
  inputRow.appendChild(submitBtn);
  questionBox.appendChild(inputRow);
}

// التحقق من إجابة الإدخال
function checkInputResultAnswer(q, val) {
  const tolerance = 0.001 * Math.max(1, Math.abs(q.correctAnswer));
  if (Math.abs(val - q.correctAnswer) <= tolerance) {
    handleCorrectAnswer(q, "إجابة صحيحة.\n" + q.explanation);
  } else {
    handleWrongAnswer(
      q,
      `إجابة غير صحيحة.\nالقيمة الصحيحة تقريبًا: ${roundTo(
        q.correctAnswer,
        3
      )} ${q.toUnit}\n` + q.explanation
    );
  }
}

// معالجة الإجابة الصحيحة
function handleCorrectAnswer(q, message) {
  feedbackDiv.textContent = message;
  feedbackDiv.className = "feedback correct";
  score += 10;
  correctCount += 1;
  updateStatus();
  nextBtn.disabled = false;
}

// معالجة الإجابة الخاطئة
function handleWrongAnswer(q, message) {
  feedbackDiv.textContent = message;
  feedbackDiv.className = "feedback wrong";
  updateStatus();
  nextBtn.disabled = false;
}

// تحديث شريط الحالة
function updateStatus() {
  levelSpan.textContent = level;
  scoreSpan.textContent = score;
  correctCountSpan.textContent = correctCount;
}

// بدء مؤقت للمستوى 4
function startTimer() {
  if (level !== 4) return;
  timerBox.classList.remove("hidden");
  timeLeft = 30;
  timeLeftSpan.textContent = timeLeft;
  timeLeftSpan.classList.remove("timer-danger");

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    timeLeftSpan.textContent = timeLeft;
    if (timeLeft <= 10) {
      timeLeftSpan.classList.add("timer-danger");
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      feedbackDiv.textContent = "انتهى الوقت! حاول مرة أخرى في السؤال التالي.";
      feedbackDiv.className = "feedback wrong";
      nextBtn.disabled = false;
    }
  }, 1000);
}

// التحقق من الانتقال للمستوى التالي
function checkLevelUp() {
  if (correctCount >= targetCorrect && level < 5) {
    // حفظ رقم المستوى الحالي قبل الانتقال
    const finishedLevel = level;

    // عرض درجات هذا المستوى قبل الترقية
    alert(
      `انتهيت من المستوى ${finishedLevel}.\n` +
      `عدد الإجابات الصحيحة في هذا المستوى: ${correctCount} من ${targetCorrect}.\n` +
      `مجموع نقاطك حتى الآن: ${score}.`
    );

    // الانتقال إلى المستوى التالي
    level++;
    correctCount = 0;
    updateStatus();

    alert(`أحسنت! تم الانتقال إلى المستوى ${level}.`);

    // إذا كنت لا تريد مؤقتًا في أي مستوى، يمكنك إخفاء المؤقت دائمًا:
    timerBox.classList.add("hidden");
    if (timerInterval) clearInterval(timerInterval);

  } else if (level === 5 && correctCount >= targetCorrect) {
    // عرض درجات المستوى الخامس النهائي
    alert(
      `انتهيت من المستوى 5 (الاختبار النهائي).\n` +
      `عدد الإجابات الصحيحة في هذا المستوى: ${correctCount} من ${targetCorrect}.\n` +
      `مجموع نقاطك النهائي: ${score}.`
    );
  }
}

function endQuiz() {
  function restartQuiz() {
  // إعادة تعيين المتغيرات
  level = 1;
  score = 0;
  correctCount = 0;

  updateStatus();

  // إخفاء المؤقت مبدئياً
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerBox.classList.add("hidden");

  feedbackDiv.textContent = "";
  feedbackDiv.className = "feedback";

  // إنشاء سؤال جديد من البداية
  newQuestion();
}


  // عرض النتيجة النهائية
  questionBox.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "question-text";
  summary.innerHTML =
    `تم إنهاء الاختبار.<br>` +
    `مستواك الحالي: ${level}<br>` +
    `مجموع نقاطك: ${score}<br>` +
    `إجابات صحيحة في هذا المستوى: ${correctCount} من ${targetCorrect}`;
  questionBox.appendChild(summary);

  feedbackDiv.textContent = "يمكنك إعادة البدء بالضغط على زر (إعادة بدء الاختبار).";
  feedbackDiv.className = "feedback";

  nextBtn.disabled = true;
}
function restartQuiz() {
  // إيقاف المؤقت إن كان يعمل
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // إعادة تهيئة المتغيرات
  level = 1;
  score = 0;
  correctCount = 0;

  // تحديث شريط الحالة
  updateStatus();

  // إخفاء المؤقت في البداية
  timerBox.classList.add("hidden");

  // مسح الرسائل
  feedbackDiv.textContent = "";
  feedbackDiv.className = "feedback";

  // تفعيل زر السؤال التالي
  nextBtn.disabled = true;

  // توليد سؤال جديد من المستوى الأول
  newQuestion();
}

// توليد سؤال جديد
function newQuestion() {
  currentQuestion = generateQuestion(level);
  renderQuestion(currentQuestion);
  // لم يعد هناك مؤقت خاص بالمستوى الرابع
}


// حدث زر "السؤال التالي"
nextBtn.addEventListener("click", () => {
  checkLevelUp();
  newQuestion();
  nextBtn.disabled = true;
});
// زر إنهاء الاختبار
endBtn.addEventListener("click", () => {
  endQuiz();
});


// زر إعادة بدء الاختبار
restartBtn.addEventListener("click", () => {
  restartQuiz();
});

// بدء اللعبة أول مرة
window.onload = () => {
  newQuestion();
};
