let currentCategoryFilter = "all";

function getCategoryLabel(cat) {
  const labels = {
    general: "🌟 General",
    reading: "📚 Reading",
    homework: "✍️ Homework",
    examprep: "🔬 Exam Prep",
    project: "🎨 Project"
  };
  return labels[cat] || "🌟 General";
}

function addTask() {
  const input = document.getElementById("taskInput");
  const descInput = document.getElementById("taskDescInput");
  const priorityInput = document.getElementById("priorityInput");
  const categoryInput = document.getElementById("categoryInput");
  const dueDateInput = document.getElementById("dueDateInput");
  const errorMsg = document.getElementById("errorMsg");

  const taskText = input.value.trim();
  if (taskText === "") {
    errorMsg.textContent = "Please enter a task.";
    return;
  }
  errorMsg.textContent = "";

  const now = new Date();
  const timestamp = `Added: ${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const taskData = {
    text: taskText,
    description: descInput ? descInput.value.trim() : "",
    completed: false,
    priority: priorityInput ? priorityInput.value : "low",
    category: categoryInput ? categoryInput.value : "general",
    dueDate: dueDateInput ? dueDateInput.value : "",
    timestamp: timestamp
  };

  createTaskElement(taskData);
  
  // Reset inputs
  input.value = "";
  if (descInput) descInput.value = "";
  if (dueDateInput) dueDateInput.value = "";
  if (priorityInput) priorityInput.value = "low";
  if (categoryInput) categoryInput.value = "general";

  taskTracker();
  saveTasks();
  
  // Sync view
  filterCategory(currentCategoryFilter);
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = `priority-${task.priority} category-${task.category}`;
  
  // Store state in data attributes for resilient local storage saving
  li.setAttribute("data-text", task.text);
  li.setAttribute("data-description", task.description || "");
  li.setAttribute("data-priority", task.priority);
  li.setAttribute("data-category", task.category);
  li.setAttribute("data-due-date", task.dueDate || "");
  li.setAttribute("data-timestamp", task.timestamp);

  // Format due date nicely if present
  let dueDateHtml = "";
  if (task.dueDate) {
    const d = new Date(task.dueDate);
    if (!isNaN(d.getTime())) {
      dueDateHtml = `<span class="due-date-badge">📅 ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>`;
    }
  }

  li.innerHTML = `
    <div class="task-main" style="display: flex; flex-direction: column; gap: 0.25rem; flex: 1;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark completed" style="margin: 0;">
        <span class="task-text ${task.completed ? 'completed' : ''}" style="word-break: break-word; font-weight: 600;">${task.text}</span>
      </div>
      ${task.description ? `<p class="task-desc-display ${task.completed ? 'completed' : ''}" style="font-size: 0.85rem; color: var(--text-muted); margin-left: 2rem; word-break: break-word; opacity: 0.85; margin-top: 0.15rem;">${task.description}</p>` : ''}
    </div>
    <div class="task-meta" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
      <span class="task-badge badge-${task.category}">${getCategoryLabel(task.category)}</span>
      <span class="task-badge priority-badge" style="background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); color: var(--text-muted); opacity: 0.85;">${task.priority.toUpperCase()}</span>
      ${dueDateHtml}
      <small class="task-timestamp" style="color: var(--text-muted); opacity: 0.7; font-size: 0.7rem;">${task.timestamp}</small>
    </div>
    <div class="task-actions" style="display: flex; gap: 0.5rem; margin-left: 0.5rem;">
      <button class="edit-btn">Edit</button>
      <button class="remove-btn">Remove</button>
    </div>
  `;

  const checkbox = li.querySelector('input[type="checkbox"]');
  checkbox.addEventListener("change", () => {
    li.querySelector('.task-text').classList.toggle("completed");
    const descP = li.querySelector('.task-desc-display');
    if (descP) descP.classList.toggle("completed");
    
    if (checkbox.checked) {
      if (typeof addXp === "function") {
        addXp(15);
        showToast("🎯 +15 XP Task Completed!");
      }
    } else {
      if (typeof addXp === "function") {
        addXp(-15);
      }
    }
    
    taskTracker();
    saveTasks();
  });

  const editButton = li.querySelector('.edit-btn');
  editButton.addEventListener("click", () => {
    const span = li.querySelector('.task-text');
    const currentDesc = li.getAttribute("data-description") || "";
    
    const newTask = prompt("Edit Task Title:", span.textContent);
    if (newTask !== null && newTask.trim() !== "") {
      const newDesc = prompt("Edit Task Description (Optional):", currentDesc);
      if (newDesc !== null) {
        const trimmedTitle = newTask.trim();
        const trimmedDesc = newDesc.trim();
        
        span.textContent = trimmedTitle;
        li.setAttribute("data-text", trimmedTitle);
        li.setAttribute("data-description", trimmedDesc);
        
        // Re-render description paragraph dynamically
        let p = li.querySelector('.task-desc-display');
        if (trimmedDesc !== "") {
          if (!p) {
            p = document.createElement("p");
            p.className = `task-desc-display ${li.querySelector('input[type="checkbox"]').checked ? 'completed' : ''}`;
            p.setAttribute("style", "font-size: 0.85rem; color: var(--text-muted); margin-left: 2rem; word-break: break-word; opacity: 0.85; margin-top: 0.15rem;");
            li.querySelector('.task-main').appendChild(p);
          }
          p.textContent = trimmedDesc;
        } else {
          if (p) p.remove();
        }
        
        saveTasks();
      }
    }
  });

  li.querySelector('.remove-btn').addEventListener("click", () => {
    li.remove();
    taskTracker();
    saveTasks();
  });

  document.getElementById("taskList").appendChild(li);
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach((li) => {
    tasks.push({
      text: li.getAttribute("data-text") || li.querySelector(".task-text").textContent,
      description: li.getAttribute("data-description") || "",
      completed: li.querySelector("input").checked,
      priority: li.getAttribute("data-priority") || "low",
      category: li.getAttribute("data-category") || "general",
      dueDate: li.getAttribute("data-due-date") || "",
      timestamp: li.getAttribute("data-timestamp") || li.querySelector(".task-timestamp").textContent
    });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  savedTasks.forEach((task) => createTaskElement(task));
  taskTracker();
}

document.addEventListener("DOMContentLoaded", loadTasks);

const clearAllBtn = document.getElementById("clearAllBtn");
if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all tasks?")) {
      document.getElementById("taskList").innerHTML = "";
      taskTracker();
      saveTasks();
    }
  });
}

function initCategoryFilters() {
  const filters = document.querySelectorAll(".filter-pill");
  filters.forEach(pill => {
    pill.addEventListener("click", () => {
      filters.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      
      const category = pill.getAttribute("data-category");
      filterCategory(category);
    });
  });
}

function filterCategory(category) {
  currentCategoryFilter = category;
  const searchInput = document.getElementById("searchInput");
  const query = searchInput ? searchInput.value.toLowerCase() : "";
  
  document.querySelectorAll("#taskList li").forEach(li => {
    const liCategory = li.getAttribute("data-category") || "general";
    const liText = (li.getAttribute("data-text") || li.querySelector(".task-text").textContent).toLowerCase();
    
    const matchesCategory = category === "all" || liCategory === category;
    const matchesSearch = liText.includes(query);
    
    if (matchesCategory && matchesSearch) {
      li.style.display = "flex";
      li.style.opacity = "1";
    } else {
      li.style.display = "none";
      li.style.opacity = "0";
    }
  });
}

document.addEventListener("DOMContentLoaded", initCategoryFilters);

function taskTracker() {
  const tasks = document.querySelectorAll("#taskList li");
  const completed = document.querySelectorAll("#taskList input:checked");
  
  // Phase 2 Bento Stats Hook
  const bentoTasks = document.getElementById("bentoTasksCount");
  if (bentoTasks) bentoTasks.innerText = completed.length;
  
  const bentoProd = document.getElementById("bentoProdScore");
  if (bentoProd) {
    const percentage = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
    bentoProd.innerText = percentage + (completed.length * 10);
  }

  const stats = document.getElementById("taskStats");
  if (stats) stats.innerText = `✅ ${completed.length} / ${tasks.length} completed`;

  const headerStats = document.getElementById("headerStats");
  if (headerStats) {
    const percentage = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
    headerStats.innerText = `🎯 ${percentage}%`;
  }
  
  const celebration = document.getElementById("celebration");
  if (celebration) {
    if (tasks.length > 0 && tasks.length === completed.length) {
      celebration.classList.remove("hidden");
      celebration.classList.add("show");
    } else {
      celebration.classList.remove("show");
      celebration.classList.add("hidden");
    }
  }
}
const searchInput = document.getElementById("searchInput");
if (searchInput) {
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.toLowerCase();
    document.querySelectorAll("#taskList li").forEach((li) => {
      const text = li.querySelector("span").textContent.toLowerCase();
      li.style.display = text.includes(query) ? "flex" : "none";
    });
  });
}

// Premium SaaS Theme Enforcement
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.setAttribute("data-theme", "dark");
});

// Dynamic Greeting & Live Date Engine
function updateHeaderGreetingAndDate() {
  const greetingEl = document.getElementById("headerGreeting");
  const dateEl = document.getElementById("headerDate");
  
  if (!greetingEl && !dateEl) return;

  const now = new Date();
  const hour = now.getHours();
  
  let greetingText = "👋 Focus Time!";
  if (hour >= 5 && hour < 12) {
    greetingText = "🌅 Good morning, Student!";
  } else if (hour >= 12 && hour < 17) {
    greetingText = "☀️ Good afternoon, Student!";
  } else if (hour >= 17 && hour < 22) {
    greetingText = "🌆 Good evening, Student!";
  } else {
    greetingText = "🌌 Happy late-night study!";
  }

  // Format date: e.g. "Sun, May 17"
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const formattedDate = now.toLocaleDateString('en-US', options);

  if (greetingEl) greetingEl.textContent = greetingText;
  if (dateEl) dateEl.textContent = formattedDate;
}

// Initialize greeting and date when page loads
document.addEventListener("DOMContentLoaded", updateHeaderGreetingAndDate);

// ==========================================================================
// POMODORO FOCUS TIMER ENGINE
// ==========================================================================

let timerInterval = null;
let timeLeft = 25 * 60; // default 25 mins
let isTimerRunning = false;
let currentTimerMode = "study"; // "study", "short", "long"

const timerTimes = {
  study: 25 * 60,
  short: 5 * 60,
  long: 15 * 60
};

function initPomodoro() {
  const startPauseBtn = document.getElementById("startPauseBtn");
  const resetTimerBtn = document.getElementById("resetTimerBtn");
  const modeButtons = document.querySelectorAll(".mode-btn");
  
  if (!startPauseBtn) return; // not on this page

  // Mode Selection
  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const mode = btn.getAttribute("data-mode");
      switchTimerMode(mode);
    });
  });

  // Controls
  startPauseBtn.addEventListener("click", toggleTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  updateTimerDisplay();
}

function switchTimerMode(mode) {
  pauseTimer();
  currentTimerMode = mode;
  timeLeft = timerTimes[mode];
  updateTimerDisplay();
}

function toggleTimer() {
  const startPauseBtn = document.getElementById("startPauseBtn");
  if (isTimerRunning) {
    pauseTimer();
  } else {
    isTimerRunning = true;
    if (startPauseBtn) startPauseBtn.innerText = "⏸️ Pause";
    timerInterval = setInterval(tickTimer, 1000);
  }
}

function pauseTimer() {
  const startPauseBtn = document.getElementById("startPauseBtn");
  isTimerRunning = false;
  if (startPauseBtn) startPauseBtn.innerText = "▶️ Start";
  clearInterval(timerInterval);
}

function resetTimer() {
  pauseTimer();
  timeLeft = timerTimes[currentTimerMode];
  updateTimerDisplay();
}

function tickTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    updateTimerDisplay();
  } else {
    // Timer Expired!
    pauseTimer();
    playCompletionAlert();
    triggerTimerConfetti();
    
    // Auto-integrate with Daily Goal Tracker!
    if (currentTimerMode === "study" && typeof logStudyMinutes === "function") {
      logStudyMinutes(25);
    }
    
    // Auto reset to mode time
    timeLeft = timerTimes[currentTimerMode];
    updateTimerDisplay();
    
    alert(`🎉 Focus Session Finished: ${currentTimerMode.toUpperCase()} completed!`);
  }
}

function updateTimerDisplay() {
  const timerDisplay = document.getElementById("timerDisplay");
  if (!timerDisplay) return;
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  timerDisplay.innerText = formattedTime;
  
  // Phase 4: Pomodoro SVG Progress ring animation
  const timerProgress = document.getElementById("timerProgressRing");
  if (timerProgress) {
    const totalSeconds = timerTimes[currentTimerMode];
    const percent = timeLeft / totalSeconds;
    const circumference = 471.24; // 2 * PI * 75
    timerProgress.style.strokeDashoffset = circumference * (1 - percent);
  }

  // Sync tab title
  const modeEmoji = currentTimerMode === "study" ? "⏱️" : "☕";
  document.title = `(${formattedTime}) ${modeEmoji} Study Tracker`;
}

// Custom web audio chime (no assets needed!)
function playCompletionAlert() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play a lovely double-tone chime
    const playTone = (freq, startOffset, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    };
    
    // Play chime: C5 (523.25Hz) followed by E5 (659.25Hz)
    playTone(523.25, 0, 0.4);
    playTone(659.25, 0.15, 0.5);
  } catch (e) {
    console.error("Audio error", e);
  }
}

function triggerTimerConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  }
}

document.addEventListener("DOMContentLoaded", initPomodoro);

// ==========================================================================
// STUDY INSPIRATION QUOTES ROTATOR
// ==========================================================================

const studyQuotes = [
  { text: "Focus on being productive, not busy.", author: "Tim Ferriss" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Small progress each day adds up to big results.", author: "Satya Nani" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your talent determines what you can do. Your motivation determines how much you are willing to do.", author: "Lou Holtz" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" }
];

let currentQuoteIndex = 0;

function initQuotes() {
  const newQuoteBtn = document.getElementById("newQuoteBtn");
  if (newQuoteBtn) {
    newQuoteBtn.addEventListener("click", rotateQuote);
  }
}

function rotateQuote() {
  const quoteTextEl = document.getElementById("quoteText");
  const quoteAuthorEl = document.getElementById("quoteAuthor");
  
  if (!quoteTextEl || !quoteAuthorEl) return;

  // Find a new random index that is different from current
  let newIndex = currentQuoteIndex;
  while (newIndex === currentQuoteIndex && studyQuotes.length > 1) {
    newIndex = Math.floor(Math.random() * studyQuotes.length);
  }
  currentQuoteIndex = newIndex;
  
  const nextQuote = studyQuotes[currentQuoteIndex];

  // Smooth fade transition using CSS opacities
  quoteTextEl.style.opacity = "0";
  quoteAuthorEl.style.opacity = "0";

  setTimeout(() => {
    quoteTextEl.innerText = `"${nextQuote.text}"`;
    quoteAuthorEl.innerText = `— ${nextQuote.author}`;
    
    quoteTextEl.style.opacity = "0.9";
    quoteAuthorEl.style.opacity = "1";
  }, 300);
}

document.addEventListener("DOMContentLoaded", initQuotes);

// ==========================================================================
// DAILY STUDY GOAL TRACKER ENGINE
// ==========================================================================

const goalState = {
  dailyMinutes: 0,
  goalTarget: 60,
  streakCount: 0,
  lastGoalDate: "", // YYYY-MM-DD
  lastStudyDate: "", // YYYY-MM-DD
  xp: 0,
  level: 1
};

function getXpForNextLevel(lvl) {
  return 50 + (lvl * 50);
}

function addXp(amount) {
  goalState.xp += amount;
  if (goalState.xp < 0) goalState.xp = 0;
  
  let xpNeeded = getXpForNextLevel(goalState.level);
  let leveledUp = false;
  
  while (goalState.xp >= xpNeeded) {
    goalState.xp -= xpNeeded;
    goalState.level += 1;
    xpNeeded = getXpForNextLevel(goalState.level);
    leveledUp = true;
  }
  
  if (leveledUp) {
    showToast(`🎉 Level Up! You reached Level ${goalState.level}!`, "success");
    triggerTimerConfetti();
  }
  
  saveGoalState();
  updateGoalUI();
}

function initGoalTracker() {
  const add15mBtn = document.getElementById("add15m");
  const add30mBtn = document.getElementById("add30m");
  const add60mBtn = document.getElementById("add60m");
  const resetGoalBtn = document.getElementById("resetGoal");
  const goalTargetInput = document.getElementById("goalTargetInput");

  if (!add15mBtn) return; // Not on this page

  // Load Goal State
  loadGoalState();

  // Attach event listeners
  add15mBtn.addEventListener("click", () => logStudyMinutes(15));
  add30mBtn.addEventListener("click", () => logStudyMinutes(30));
  add60mBtn.addEventListener("click", () => logStudyMinutes(60));
  resetGoalBtn.addEventListener("click", () => {
    if (confirm("Reset today's study progress to 0?")) {
      resetTodayGoalProgress();
    }
  });

  goalTargetInput.addEventListener("change", (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 5) val = 5;
    if (val > 480) val = 480;
    e.target.value = val;
    goalState.goalTarget = val;
    saveGoalState();
    updateGoalUI();
  });

  updateGoalUI();
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadGoalState() {
  try {
    const todayStr = getTodayString();
    
    // Target
    const savedTarget = localStorage.getItem("studyGoal_target");
    if (savedTarget) goalState.goalTarget = parseInt(savedTarget, 10);
    
    const targetInput = document.getElementById("goalTargetInput");
    if (targetInput) targetInput.value = goalState.goalTarget;

    // Streak & Date info
    goalState.streakCount = parseInt(localStorage.getItem("studyGoal_streak") || "0", 10);
    goalState.lastGoalDate = localStorage.getItem("studyGoal_lastGoalDate") || "";
    goalState.lastStudyDate = localStorage.getItem("studyGoal_lastStudyDate") || "";

    // Load Gamified XP and Level
    goalState.xp = parseInt(localStorage.getItem("studyGoal_xp") || "0", 10);
    goalState.level = parseInt(localStorage.getItem("studyGoal_level") || "1", 10);

    // Daily Progress check
    const progressJSON = localStorage.getItem("studyGoal_progress");
    if (progressJSON) {
      const progress = JSON.parse(progressJSON);
      if (progress.date === todayStr) {
        goalState.dailyMinutes = progress.minutes;
      } else {
        // New day! Reset today's progress, but check if streak is broken
        goalState.dailyMinutes = 0;
        checkStreakBreak();
        saveGoalProgress();
      }
    } else {
      goalState.dailyMinutes = 0;
      saveGoalProgress();
    }
  } catch (e) {
    console.error("Error loading goal state", e);
  }
}

function checkStreakBreak() {
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();
  
  if (goalState.lastGoalDate !== todayStr && goalState.lastGoalDate !== yesterdayStr) {
    goalState.streakCount = 0;
    localStorage.setItem("studyGoal_streak", "0");
  }
}

function saveGoalProgress() {
  const todayStr = getTodayString();
  const progress = {
    date: todayStr,
    minutes: goalState.dailyMinutes
  };
  localStorage.setItem("studyGoal_progress", JSON.stringify(progress));
}

function saveGoalState() {
  localStorage.setItem("studyGoal_target", goalState.goalTarget.toString());
  localStorage.setItem("studyGoal_streak", goalState.streakCount.toString());
  localStorage.setItem("studyGoal_lastGoalDate", goalState.lastGoalDate);
  localStorage.setItem("studyGoal_lastStudyDate", goalState.lastStudyDate);
  localStorage.setItem("studyGoal_xp", goalState.xp.toString());
  localStorage.setItem("studyGoal_level", goalState.level.toString());
  saveGoalProgress();
}

function logStudyMinutes(mins) {
  const todayStr = getTodayString();
  const yesterdayStr = getYesterdayString();
  
  goalState.dailyMinutes += mins;
  goalState.lastStudyDate = todayStr;
  
  // Study session completed rewards!
  addXp(mins * 2);
  showToast(`✨ Logged ${mins}m of Focus (+${mins * 2} XP)!`, "success");

  // Check Streak update
  if (goalState.dailyMinutes >= goalState.goalTarget) {
    if (goalState.lastGoalDate !== todayStr) {
      if (goalState.lastGoalDate === yesterdayStr || goalState.streakCount === 0) {
        goalState.streakCount += 1;
      } else {
        goalState.streakCount = 1;
      }
      goalState.lastGoalDate = todayStr;
      
      const badge = document.getElementById("streakBadge");
      if (badge) {
        badge.style.transform = "scale(1.3) rotate(5deg)";
        badge.style.background = "rgba(249, 115, 22, 0.3)";
        setTimeout(() => {
          badge.style.transform = "";
          badge.style.background = "";
        }, 1000);
      }
      
      triggerTimerConfetti();
      showToast("🔥 Daily Goal Reached! Streak Updated!", "success");
    }
  }
  
  saveGoalState();
  updateGoalUI();
}

function resetTodayGoalProgress() {
  goalState.dailyMinutes = 0;
  
  const todayStr = getTodayString();
  if (goalState.lastGoalDate === todayStr) {
    goalState.lastGoalDate = localStorage.getItem("studyGoal_prevGoalDate") || "";
    goalState.streakCount = Math.max(0, goalState.streakCount - 1);
    localStorage.setItem("studyGoal_streak", goalState.streakCount.toString());
    localStorage.setItem("studyGoal_lastGoalDate", goalState.lastGoalDate);
  }
  
  saveGoalProgress();
  updateGoalUI();
}

function updateGoalUI() {
  const progressRingBar = document.getElementById("progressRingBar");
  const goalPercent = document.getElementById("goalPercent");
  const goalMinutesRatio = document.getElementById("goalMinutesRatio");
  const streakCount = document.getElementById("streakCount");
  
  const playerLevel = document.getElementById("playerLevel");
  const playerXpBar = document.getElementById("playerXpBar");
  const playerXpText = document.getElementById("playerXpText");

  // Phase 2 Bento Stats Hook
  const bentoFocusHours = document.getElementById("bentoFocusHours");
  if (bentoFocusHours) bentoFocusHours.innerText = (goalState.dailyMinutes / 60).toFixed(1);
  const bentoStreak = document.getElementById("bentoStreak");
  if (bentoStreak) bentoStreak.innerText = goalState.streakCount;

  // Render Gamification XP and Levels
  if (playerLevel) playerLevel.innerText = `LVL ${goalState.level}`;
  if (playerXpBar && playerXpText) {
    const xpNeeded = getXpForNextLevel(goalState.level);
    const xpPercent = Math.min(100, Math.round((goalState.xp / xpNeeded) * 100));
    playerXpBar.style.width = `${xpPercent}%`;
    playerXpText.innerText = `${goalState.xp} / ${xpNeeded} XP`;
  }

  if (!goalPercent) return;

  const percent = Math.min(100, Math.round((goalState.dailyMinutes / goalState.goalTarget) * 100));
  
  const circumference = 314.159;
  const offset = circumference - (percent / 100) * circumference;
  
  if (progressRingBar) {
    progressRingBar.style.strokeDashoffset = offset;
    
    if (percent >= 100) {
      progressRingBar.style.stroke = "var(--success-color, #10b981)";
    } else {
      progressRingBar.style.stroke = "var(--accent-color)";
    }
  }
  
  goalPercent.innerText = `${percent}%`;
  goalMinutesRatio.innerText = `${goalState.dailyMinutes} / ${goalState.goalTarget}m`;
  if (streakCount) streakCount.innerText = goalState.streakCount;
}

document.addEventListener("DOMContentLoaded", initGoalTracker);

// ==========================================================================
// QUICK NOTES & BRAIN DUMP ENGINE
// ==========================================================================

function initQuickNotes() {
  const quickNotesArea = document.getElementById("quickNotesArea");
  const notesWordCount = document.getElementById("notesWordCount");
  const notesCharCount = document.getElementById("notesCharCount");
  const copyNotesBtn = document.getElementById("copyNotesBtn");
  const clearNotesBtn = document.getElementById("clearNotesBtn");
  const notesToast = document.getElementById("notesToast");

  if (!quickNotesArea) return;

  // Load Saved Note
  quickNotesArea.value = localStorage.getItem("quickNotes") || "";
  updateNoteStats();

  // Auto-Save and update counts as user types
  quickNotesArea.addEventListener("input", () => {
    localStorage.setItem("quickNotes", quickNotesArea.value);
    updateNoteStats();
  });

  // Copy to Clipboard Action
  copyNotesBtn.addEventListener("click", () => {
    const text = quickNotesArea.value;
    if (!text.trim()) {
      showToast("Write something in the note first! ✍️");
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      // micro-animation on button
      copyNotesBtn.classList.add("success-active");
      const originalText = copyNotesBtn.innerHTML;
      copyNotesBtn.innerHTML = "✅ Copied!";
      
      showToast("Note copied to clipboard! 👍");

      setTimeout(() => {
        copyNotesBtn.classList.remove("success-active");
        copyNotesBtn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy note", err);
      showToast("Failed to copy note ❌");
    });
  });

  // Clear notes Action
  clearNotesBtn.addEventListener("click", () => {
    if (!quickNotesArea.value.trim()) return;
    
    if (confirm("Are you sure you want to delete all notes?")) {
      quickNotesArea.value = "";
      localStorage.removeItem("quickNotes");
      updateNoteStats();
      showToast("Notes cleared 🧹");
    }
  });

  function updateNoteStats() {
    const text = quickNotesArea.value;
    const charCount = text.length;
    
    // Word counting using regex split
    const trimmed = text.trim();
    const wordCount = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
    
    if (notesCharCount) notesCharCount.innerText = `${charCount} chars`;
    if (notesWordCount) notesWordCount.innerText = `${wordCount} words`;
  }

  function showToast(message) {
    if (!notesToast) return;
    notesToast.innerText = message;
    notesToast.classList.add("show");
    
    setTimeout(() => {
      notesToast.classList.remove("show");
    }, 2500);
  }
}

// Global premium notification system (Phase 5)
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("toast-fade-out");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  container.className = "toast-container";
  document.body.appendChild(container);
  return container;
}

// Immersive Command Palette Interaction (Phase 5)
function initCommandPalette() {
  const palette = document.getElementById("commandPalette");
  const input = document.getElementById("paletteSearchInput");
  const results = document.getElementById("paletteResults");
  
  if (!palette) return;
  const items = results.querySelectorAll(".palette-item");
  let activeIndex = 0;

  // Toggle Command Palette (Ctrl+K or Cmd+K)
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openPalette();
    }
  });

  input.addEventListener("keydown", (e) => {
    const currentItems = results.querySelectorAll(".palette-item:not(.hidden)");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentItems.length;
      updateActiveItem(currentItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentItems.length) % currentItems.length;
      updateActiveItem(currentItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentItems[activeIndex]) {
        triggerAction(currentItems[activeIndex].getAttribute("data-action"));
      }
    } else if (e.key === "Escape") {
      closePalette();
    }
  });

  // Global Hotkeys (when no inputs focused)
  window.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
    
    const key = e.key.toLowerCase();
    if (key === "n") {
      e.preventDefault();
      triggerAction("addTask");
    } else if (key === "f") {
      e.preventDefault();
      triggerAction("startStudy");
    } else if (key === "s") {
      e.preventDefault();
      triggerAction("startShort");
    } else if (key === "l") {
      e.preventDefault();
      triggerAction("startLong");
    } else if (key === "o") {
      e.preventDefault();
      triggerAction("focusNotes");
    } else if (key === "c") {
      e.preventDefault();
      triggerAction("clearTasks");
    }
  });

  // Filter commands by typing
  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    activeIndex = 0;
    items.forEach(item => {
      const text = item.querySelector(".item-text").innerText.toLowerCase();
      if (text.includes(query)) {
        item.classList.remove("hidden");
      } else {
        item.classList.add("hidden");
      }
    });
    const currentItems = results.querySelectorAll(".palette-item:not(.hidden)");
    updateActiveItem(currentItems);
  });

  // Click handling
  items.forEach((item) => {
    item.addEventListener("click", () => {
      triggerAction(item.getAttribute("data-action"));
    });
  });

  // Click outside to dismiss
  palette.addEventListener("click", (e) => {
    if (e.target === palette) {
      closePalette();
    }
  });

  function openPalette() {
    palette.setAttribute("aria-hidden", "false");
    input.value = "";
    items.forEach(item => item.classList.remove("hidden"));
    activeIndex = 0;
    updateActiveItem(items);
    setTimeout(() => input.focus(), 50);
  }

  function closePalette() {
    palette.setAttribute("aria-hidden", "true");
    input.blur();
  }

  function updateActiveItem(list) {
    items.forEach(item => item.classList.remove("active"));
    if (list[activeIndex]) {
      list[activeIndex].classList.add("active");
      list[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function triggerAction(action) {
    closePalette();
    
    switch (action) {
      case "addTask":
        const taskInput = document.getElementById("taskInput");
        if (taskInput) {
          taskInput.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => taskInput.focus(), 300);
          showToast("Type task name & hit Enter!", "success");
        }
        break;
      case "startStudy":
        setTimerMode("study");
        toggleTimer();
        showToast("⏱️ Focus Session Started!", "success");
        break;
      case "startShort":
        setTimerMode("short");
        toggleTimer();
        showToast("☕ Short Break Started!", "success");
        break;
      case "startLong":
        setTimerMode("long");
        toggleTimer();
        showToast("🥤 Long Break Started!", "success");
        break;
      case "focusNotes":
        const notes = document.getElementById("quickNotesArea");
        if (notes) {
          notes.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => notes.focus(), 300);
          showToast("Jot down your notes! 📝", "success");
        }
        break;
      case "clearTasks":
        const clearBtn = document.getElementById("clearAllBtn");
        if (clearBtn) {
          clearBtn.click();
        }
        break;
      case "filterStudy":
        filterCategory("study");
        break;
      case "filterPersonal":
        filterCategory("personal");
        break;
      case "filterWork":
        filterCategory("work");
        break;
    }
  }

  // Global helper for setting timer mode
  window.setTimerMode = function(mode) {
    const btns = document.querySelectorAll(".mode-btn");
    btns.forEach(btn => {
      if (btn.getAttribute("data-mode") === mode) {
        btn.click();
      }
    });
  }

  function filterCategory(cat) {
    const pills = document.querySelectorAll(".filter-pill");
    pills.forEach(pill => {
      if (pill.getAttribute("data-category").toLowerCase() === cat.toLowerCase()) {
        pill.click();
        showToast(`Filtered by Category: ${cat} 📚`, "success");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initQuickNotes);
document.addEventListener("DOMContentLoaded", initCommandPalette);
