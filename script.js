// DOM Elements
const introOverlay = document.querySelector('.intro-overlay');
const getStartedBtn = document.getElementById('getStarted');
const navBtns = document.querySelectorAll('.nav-btn[data-section]');
const sections = document.querySelectorAll('.section');
const themeToggle = document.getElementById('themeToggle');
const addSemesterBtn = document.getElementById('addSemester');
const semesterList = document.getElementById('semesterList');
const cgpaValue = document.getElementById('cgpaValue');

// Notes Elements
const notesList = document.getElementById('notesList');
const newNoteBtn = document.getElementById('newNote');
const noteTitle = document.getElementById('noteTitle');
const noteEditor = document.getElementById('editor');

// Pomodoro Elements
const timer = document.getElementById('timer');
const startTimer = document.getElementById('startTimer');
const resetTimer = document.getElementById('resetTimer');
const focusCount = document.getElementById('focusCount');
const totalTime = document.getElementById('totalTime');

// Calculator Elements
const calcTabs = document.querySelectorAll('.calc-tab');
const calcHistory = document.getElementById('calcHistory');
const display = document.getElementById('standardDisplay');
const standardButtons = document.getElementById('standardButtons');

// Flashcard Elements
const flashcardSection = document.getElementById('flashcards');
const deckSelect = document.getElementById('deckSelect');
const currentCard = document.getElementById('currentCard');
const newDeckBtn = document.getElementById('newDeck');
const addCardBtn = document.getElementById('addCard');
const prevCardBtn = document.getElementById('prevCard');
const nextCardBtn = document.getElementById('nextCard');

// App State
let currentNote = null;
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let timerInterval = null;
let timeLeft = 25 * 60; // 25 minutes in seconds
let isTimerRunning = false;
let focusSessions = parseInt(localStorage.getItem('focusSessions')) || 0;
let totalFocusTime = parseInt(localStorage.getItem('totalFocusTime')) || 0;
let calculation = {
    firstNumber: '',
    operator: '',
    secondNumber: '',
    result: null
};
let decks = JSON.parse(localStorage.getItem('flashcardDecks')) || [];
let currentDeck = null;
let currentCardIndex = 0;
let semesters = JSON.parse(localStorage.getItem('semesters')) || [];

// Theme Management
const theme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', theme);
themeToggle.querySelector('i').className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

// Initialize App
function initializeApp() {
    setupEventListeners();
    renderNotes();
    setupCalculator();
    updateTimerDisplay();
    updateStats();
    renderDecks();
    loadSemesters();
}

// Event Listeners Setup
function setupEventListeners() {
    // Intro Animation
    getStartedBtn.addEventListener('click', () => {
        introOverlay.style.opacity = '0';
        setTimeout(() => introOverlay.style.display = 'none', 500);
    });

    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === btn.dataset.section) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.querySelector('i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });

    // Notes
    newNoteBtn.addEventListener('click', createNewNote);
    noteTitle.addEventListener('input', saveCurrentNote);
    noteEditor.addEventListener('input', saveCurrentNote);

    // Pomodoro
    startTimer.addEventListener('click', toggleTimer);
    resetTimer.addEventListener('click', resetPomodoro);

    // Calculator
    calcTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            calcTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Flashcards
    newDeckBtn.addEventListener('click', createNewDeck);
    addCardBtn.addEventListener('click', createNewCard);
    prevCardBtn.addEventListener('click', showPreviousCard);
    nextCardBtn.addEventListener('click', showNextCard);
    currentCard.addEventListener('click', flipCard);
    deckSelect.addEventListener('change', (e) => {
        currentDeck = decks.find(d => d.id === parseInt(e.target.value));
        currentCardIndex = 0;
        renderCurrentCard();
    });

    // CGPA Calculator
    addSemesterBtn.addEventListener('click', addSemester);
    semesterList.addEventListener('input', calculateCGPA);
    semesterList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-course')) {
            e.target.closest('.course-item').remove();
            calculateCGPA();
        }
        if (e.target.classList.contains('add-course')) {
            const courseList = e.target.closest('.semester').querySelector('.course-list');
            addCourse(courseList);
        }
    });
}

// Notes Functions
function createNewNote() {
    const note = {
        id: Date.now(),
        title: 'Untitled Note',
        content: '',
        timestamp: new Date().toISOString()
    };
    notes.unshift(note);
    currentNote = note;
    saveNotes();
    renderNotes();
    noteTitle.focus();
}

function renderNotes() {
    notesList.innerHTML = notes.map(note => `
        <div class="note-item ${note === currentNote ? 'active' : ''}" 
             onclick="selectNote(${note.id})">
            <h3>${note.title || 'Untitled Note'}</h3>
            <p>${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</p>
        </div>
    `).join('');
    
    if (currentNote) {
        noteTitle.value = currentNote.title;
        noteEditor.value = currentNote.content;
    } else if (notes.length > 0) {
        selectNote(notes[0].id);
    } else {
        noteTitle.value = '';
        noteEditor.value = '';
    }
}

function selectNote(id) {
    currentNote = notes.find(note => note.id === id);
    renderNotes();
}

function saveCurrentNote() {
    if (!currentNote) return;
    currentNote.title = noteTitle.value;
    currentNote.content = noteEditor.value;
    currentNote.timestamp = new Date().toISOString();
    saveNotes();
    renderNotes();
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Pomodoro Functions
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        startTimer.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
    } else {
        timerInterval = setInterval(updateTimer, 1000);
        startTimer.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
    }
    isTimerRunning = !isTimerRunning;
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        completePomodoro();
    }
}

function completePomodoro() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    focusSessions++;
    totalFocusTime += 25;
    localStorage.setItem('focusSessions', focusSessions);
    localStorage.setItem('totalFocusTime', totalFocusTime);
    updateStats();
    resetPomodoro();
    new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568.wav').play();
}

function resetPomodoro() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 25 * 60;
    updateTimerDisplay();
    startTimer.innerHTML = '<i class="fas fa-play"></i><span>Start</span>';
}

function updateStats() {
    focusCount.textContent = focusSessions;
    totalTime.textContent = totalFocusTime;
}

// Calculator Functions
function setupCalculator() {
    const buttons = [
        { text: 'C', type: 'clear' },
        { text: '⌫', type: 'backspace' },
        { text: '%', type: 'operator' },
        { text: '÷', type: 'operator' },
        { text: '7', type: 'number' },
        { text: '8', type: 'number' },
        { text: '9', type: 'number' },
        { text: '×', type: 'operator' },
        { text: '4', type: 'number' },
        { text: '5', type: 'number' },
        { text: '6', type: 'number' },
        { text: '-', type: 'operator' },
        { text: '1', type: 'number' },
        { text: '2', type: 'number' },
        { text: '3', type: 'number' },
        { text: '+', type: 'operator' },
        { text: '0', type: 'number' },
        { text: '.', type: 'decimal' },
        { text: '=', type: 'equals', span: 2 }
    ];

    standardButtons.innerHTML = buttons.map(btn => `
        <button class="calc-btn${btn.span ? ' span-2' : ''}" 
                data-type="${btn.type}"
                onclick="handleCalcButton('${btn.text}')">
            ${btn.text}
        </button>
    `).join('');
}

function handleCalcButton(value) {
    switch (value) {
        case 'C':
            clearCalculator();
            break;
        case '⌫':
            backspace();
            break;
        case '=':
            calculate();
            break;
        case '+':
        case '-':
        case '×':
        case '÷':
        case '%':
            handleOperator(value);
            break;
        case '.':
            handleDecimal();
            break;
        default:
            handleNumber(value);
    }
    updateDisplay();
}

function clearCalculator() {
    calculation = {
        firstNumber: '',
        operator: '',
        secondNumber: '',
        result: null
    };
    calcHistory.textContent = '';
}

function backspace() {
    if (calculation.secondNumber) {
        calculation.secondNumber = calculation.secondNumber.slice(0, -1);
    } else if (calculation.operator) {
        calculation.operator = '';
    } else if (calculation.firstNumber) {
        calculation.firstNumber = calculation.firstNumber.slice(0, -1);
    }
}

function handleOperator(op) {
    if (calculation.result !== null) {
        calculation.firstNumber = calculation.result.toString();
        calculation.result = null;
    }
    if (calculation.firstNumber) {
        calculation.operator = op;
    }
}

function handleDecimal() {
    if (calculation.operator) {
        if (!calculation.secondNumber.includes('.')) {
            calculation.secondNumber = calculation.secondNumber + '.';
        }
    } else {
        if (!calculation.firstNumber.includes('.')) {
            calculation.firstNumber = calculation.firstNumber + '.';
        }
    }
}

function handleNumber(num) {
    if (calculation.operator) {
        calculation.secondNumber += num;
    } else {
        if (calculation.result !== null) {
            calculation.firstNumber = num;
            calculation.result = null;
        } else {
            calculation.firstNumber += num;
        }
    }
}

function calculate() {
    if (!calculation.firstNumber || !calculation.operator || !calculation.secondNumber) return;

    const num1 = parseFloat(calculation.firstNumber);
    const num2 = parseFloat(calculation.secondNumber);

    switch (calculation.operator) {
        case '+':
            calculation.result = num1 + num2;
            break;
        case '-':
            calculation.result = num1 - num2;
            break;
        case '×':
            calculation.result = num1 * num2;
            break;
        case '÷':
            calculation.result = num2 !== 0 ? num1 / num2 : 'Error';
            break;
        case '%':
            calculation.result = num1 * (num2 / 100);
            break;
    }

    calcHistory.textContent = `${num1} ${calculation.operator} ${num2} =`;
    calculation.firstNumber = '';
    calculation.operator = '';
    calculation.secondNumber = '';
}

function updateDisplay() {
    if (calculation.result !== null) {
        display.value = calculation.result;
    } else if (calculation.secondNumber) {
        display.value = calculation.secondNumber;
    } else if (calculation.operator) {
        display.value = calculation.operator;
    } else if (calculation.firstNumber) {
        display.value = calculation.firstNumber;
    } else {
        display.value = '0';
    }
}

// Flashcard Functions
function createNewDeck() {
    const deckName = prompt('Enter deck name:');
    if (!deckName) return;

    const deck = {
        id: Date.now(),
        name: deckName,
        cards: []
    };
    decks.push(deck);
    currentDeck = deck;
    saveDecks();
    renderDecks();
}

function createNewCard() {
    if (!currentDeck) {
        alert('Please select or create a deck first');
        return;
    }

    const front = prompt('Enter the question:');
    if (!front) return;

    const back = prompt('Enter the answer:');
    if (!back) return;

    currentDeck.cards.push({
        id: Date.now(),
        front,
        back
    });
    saveDecks();
    renderCurrentCard();
}

function renderDecks() {
    deckSelect.innerHTML = `
        <option value="">Select Deck</option>
        ${decks.map(deck => `
            <option value="${deck.id}" ${currentDeck && deck.id === currentDeck.id ? 'selected' : ''}>
                ${deck.name} (${deck.cards.length} cards)
            </option>
        `).join('')}
    `;
}

function renderCurrentCard() {
    if (!currentDeck || !currentDeck.cards.length) {
        currentCard.querySelector('.flashcard-front p').textContent = 'Create a new card to get started!';
        currentCard.querySelector('.flashcard-back p').textContent = 'Answer will appear here';
        return;
    }

    const card = currentDeck.cards[currentCardIndex];
    currentCard.querySelector('.flashcard-front p').textContent = card.front;
    currentCard.querySelector('.flashcard-back p').textContent = card.back;
    currentCard.classList.remove('flipped');
}

function flipCard() {
    if (currentDeck && currentDeck.cards.length) {
        currentCard.classList.toggle('flipped');
    }
}

function showPreviousCard() {
    if (currentDeck && currentDeck.cards.length) {
        currentCardIndex = (currentCardIndex - 1 + currentDeck.cards.length) % currentDeck.cards.length;
        renderCurrentCard();
    }
}

function showNextCard() {
    if (currentDeck && currentDeck.cards.length) {
        currentCardIndex = (currentCardIndex + 1) % currentDeck.cards.length;
        renderCurrentCard();
    }
}

function saveDecks() {
    localStorage.setItem('flashcardDecks', JSON.stringify(decks));
}

// CGPA Calculator Functions
function addSemester() {
    const semester = document.createElement('div');
    semester.className = 'semester';
    semester.innerHTML = `
        <div class="semester-header">
            <h3>Semester ${semesterList.children.length + 1}</h3>
            <button class="btn-primary add-course">
                <i class="fas fa-plus"></i>
                <span>Add Course</span>
            </button>
        </div>
        <div class="course-list">
            ${createCourseRow()}
        </div>
    `;
    semesterList.appendChild(semester);
    saveSemesters();
}

function createCourseRow() {
    return `
        <div class="course-item">
            <input type="text" class="course-name" placeholder="Course Name">
            <input type="number" class="credit-hours" placeholder="Credits" min="1" max="6" value="3">
            <select class="grade">
                <option value="4.0">A (4.0)</option>
                <option value="3.7">A- (3.7)</option>
                <option value="3.3">B+ (3.3)</option>
                <option value="3.0">B (3.0)</option>
                <option value="2.7">B- (2.7)</option>
                <option value="2.3">C+ (2.3)</option>
                <option value="2.0">C (2.0)</option>
                <option value="1.7">C- (1.7)</option>
                <option value="1.3">D+ (1.3)</option>
                <option value="1.0">D (1.0)</option>
                <option value="0.0">F (0.0)</option>
            </select>
            <button class="remove-course">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function addCourse(courseList) {
    courseList.insertAdjacentHTML('beforeend', createCourseRow());
    calculateCGPA();
}

function calculateCGPA() {
    let totalPoints = 0;
    let totalCredits = 0;

    document.querySelectorAll('.course-item').forEach(course => {
        const credits = parseFloat(course.querySelector('.credit-hours').value) || 0;
        const grade = parseFloat(course.querySelector('.grade').value) || 0;
        
        if (credits > 0) {
            totalPoints += credits * grade;
            totalCredits += credits;
        }
    });

    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    cgpaValue.textContent = cgpa;
    
    // Save the current state
    saveSemesters();
}

function saveSemesters() {
    const semesters = [];
    document.querySelectorAll('.semester').forEach(semester => {
        const courses = [];
        semester.querySelectorAll('.course-item').forEach(course => {
            courses.push({
                name: course.querySelector('.course-name').value,
                credits: course.querySelector('.credit-hours').value,
                grade: course.querySelector('.grade').value
            });
        });
        semesters.push({ courses });
    });
    localStorage.setItem('semesters', JSON.stringify(semesters));
}

function loadSemesters() {
    if (semesters.length > 0) {
        semesters.forEach(semester => {
            const semesterEl = document.createElement('div');
            semesterEl.className = 'semester';
            semesterEl.innerHTML = `
                <div class="semester-header">
                    <h3>Semester ${semesterList.children.length + 1}</h3>
                    <button class="btn-primary add-course">
                        <i class="fas fa-plus"></i>
                        <span>Add Course</span>
                    </button>
                </div>
                <div class="course-list">
                    ${semester.courses.map(course => `
                        <div class="course-item">
                            <input type="text" class="course-name" placeholder="Course Name" value="${course.name}">
                            <input type="number" class="credit-hours" placeholder="Credits" min="1" max="6" value="${course.credits}">
                            <select class="grade">
                                ${[4.0, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.0].map(value => `
                                    <option value="${value}" ${parseFloat(course.grade) === value ? 'selected' : ''}>
                                        ${getGradeLetter(value)} (${value})
                                    </option>
                                `).join('')}
                            </select>
                            <button class="remove-course">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
            semesterList.appendChild(semesterEl);
        });
        calculateCGPA();
    } else {
        addSemester(); // Add one semester by default
    }
}

function getGradeLetter(value) {
    const grades = {
        4.0: 'A',
        3.7: 'A-',
        3.3: 'B+',
        3.0: 'B',
        2.7: 'B-',
        2.3: 'C+',
        2.0: 'C',
        1.7: 'C-',
        1.3: 'D+',
        1.0: 'D',
        0.0: 'F'
    };
    return grades[value] || '';
}

// Initialize the app
window.onload = initializeApp;

// Make functions available globally
window.selectNote = selectNote;
window.handleCalcButton = handleCalcButton;
