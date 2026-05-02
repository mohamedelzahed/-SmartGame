document.addEventListener('DOMContentLoaded', loadTasks);

function createSmartTask(name = null, note = "") {
    const input = document.getElementById('taskInput');
    const taskName = name || input.value.trim();
    if (taskName === "") return;

    const taskId = "id-" + Date.now();
    const container = document.getElementById('smartTasksContainer');
    
    // محرك التصنيف الذكي
    const category = categorizeTask(taskName);
    const insights = getCategoryInsights(taskName, category);

    const card = document.createElement('div');
    card.className = 'smart-card';
    card.style.borderRightColor = insights.color;
    card.id = taskId;

    card.innerHTML = `
        <div class="card-header" onclick="toggleCard(this)">
            <div>
                <i class="${insights.icon}" style="color:${insights.color}; font-size:24px; margin-left:10px;"></i>
                <span style="font-size: 1.2em;">${taskName}</span>
            </div>
            <small style="color:gray;">مجال: ${category} ▼</small>
        </div>
        <div class="card-content">
            <div class="info-grid">
                <div class="infographic-box">
                    <strong><i class="fas fa-project-diagram"></i> مسار الإدارة (فوتوغرافيك)</strong>
                    <div style="margin-top:15px; font-size: 14px;">${insights.path}</div>
                </div>
                <div class="analysis-box">
                    <strong><i class="fas fa-chart-line"></i> تحليل المحتوى الذكي</strong>
                    <canvas id="chart-${taskId}" height="150"></canvas>
                </div>
                <div class="advice-section">
                    <strong><i class="fas fa-lightbulb" style="color:#ecc94b;"></i> استشارة ${category}:</strong>
                    <p style="font-weight:normal; margin:10px 0;">${insights.advice}</p>
                    <strong><i class="fas fa-external-link-alt"></i> روابط ومصادر ذكية:</strong>
                    <ul style="font-weight:normal;">${insights.links}</ul>
                </div>
                <div style="grid-column: 1 / -1;">
                    <strong><i class="fas fa-edit"></i> ملاحظاتك وبياناتك الخاصة:</strong>
                    <textarea oninput="saveTasks()" placeholder="اكتب تفاصيل المهمة أو النتائج هنا...">${note}</textarea>
                </div>
            </div>
        </div>
    `;

    container.insertBefore(card, container.firstChild);
    initChart(`chart-${taskId}`, insights.chartData);

    if (!name) { saveTasks(); input.value = ""; }
}

function categorizeTask(name) {
    const n = name.toLowerCase();
    if (/رياضيات|فيزياء|كيمياء|احياء|تاريخ|لغتي|انجليزي/.test(n)) return "تعليم";
    if (/برمجة|حاسب|كود|تطبيق|موقع|بيانات/.test(n)) return "تقنية";
    if (/رياضة|جيم|دايت|صحة|تمرين|اكل/.test(n)) return "صحة";
    return "عام";
}

function getCategoryInsights(name, cat) {
    const data = {
        "تعليم": { icon: "fas fa-graduation-cap", color: "#3182ce", path: "فهم ➔ تلخيص ➔ تطبيق ➔ اختبار", advice: "الاستمرارية أهم من الكثافة. ذاكر بذكاء وليس بجهد.", links: "<li><a href='https://ien.edu.sa'>بوابة عين</a></li><li><a href='https://khanacademy.org'>أكاديمية خان</a></li>", chartData: [70, 30] },
        "تقنية": { icon: "fas fa-code", color: "#2d3748", path: "تحليل ➔ كود ➔ اختبار ➔ رفع (Deploy)", advice: "التوثيق (Documentation) هو نصف العمل. لا تهمله.", links: "<li><a href='https://github.com'>GitHub</a></li><li><a href='https://stackoverflow.com'>StackOverflow</a></li>", chartData: [40, 60] },
        "صحة": { icon: "fas fa-heartbeat", color: "#e53e3e", path: "إحماء ➔ تمرين ➔ استشفاء ➔ تغذية", advice: "صحتك هي استثمارك الأول. لا تضغط على نفسك فوق طاقتها.", links: "<li><a href='https://www.who.int'>منظمة الصحة العالمية</a></li><li><a href='https://www.myfitnesspal.com'>MyFitnessPal</a></li>", chartData: [50, 50] },
        "عام": { icon: "fas fa-tasks", color: "#38a169", path: "تخطيط ➔ تنفيذ ➔ مراجعة ➔ إنجاز", advice: "ابدأ بالأهم ثم المهم. رتب أولوياتك دائماً.", links: "<li><a href='https://trello.com'>Trello للتنظيم</a></li>", chartData: [80, 20] }
    };
    return data[cat];
}

function initChart(id, data) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
        type: 'line', // تغيير النوع إلى خطي ليعطي طابع التحليل
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4'],
            datasets: [{ label: 'مستوى التقدم', data: [data[0]-20, data[0]-10, data[0], data[0]+5], borderColor: '#3182ce', tension: 0.4 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function toggleCard(header) {
    const content = header.nextElementSibling;
    content.style.display = content.style.display === "block" ? "none" : "block";
}

function saveTasks() {
    const tasks = [];
    document.querySelectorAll('.smart-card').forEach(card => {
        tasks.push({ name: card.querySelector('span').innerText, note: card.querySelector('textarea').value });
    });
    localStorage.setItem('omniAssistantData', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('omniAssistantData');
    if (saved) JSON.parse(saved).reverse().forEach(t => createSmartTask(t.name, t.note));
}

function clearAllTasks() {
    if(confirm("سيتم مسح كل البيانات المحفوظة، هل أنت متأكد؟")) {
        localStorage.clear(); location.reload();
    }
}