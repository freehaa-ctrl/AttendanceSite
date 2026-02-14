/* ========================================
   MUSIC ATTENDANCE SYSTEM - COMPLETE JS
   All Bug Fixes & Enhanced Features
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================

const STUDENT_COUNT = 100;
let currentClass = "";

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('%c🎵 Music Attendance System', 'font-size: 20px; font-weight: bold; color: #D4AF37;');
    console.log('%c✅ System loaded successfully', 'color: #2D6A4F;');
    
    initializeDarkMode();
    setupEventListeners();
    showSection('homeSection');
    
    // Set today's date as default
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
});

// ========================================
// DARK MODE MANAGEMENT
// ========================================

function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeButton(true);
    }
}

function updateDarkModeButton(isDark) {
    const toggleBtn = document.getElementById("toggleMode");
    const icon = toggleBtn.querySelector('.mode-icon');
    const text = toggleBtn.querySelector('.mode-text');
    
    if (isDark) {
        icon.textContent = '☀️';
        text.textContent = 'Light';
    } else {
        icon.textContent = '🌙';
        text.textContent = 'Dark';
    }
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================

function setupEventListeners() {
    // Dark mode toggle
    const toggleBtn = document.getElementById("toggleMode");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            const isDark = document.body.classList.toggle("dark-mode");
            localStorage.setItem('darkMode', isDark);
            updateDarkModeButton(isDark);
            showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
        });
    }
    
    // Date change listener
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput) {
        dateInput.addEventListener("change", function () {
            if (currentClass) {
                loadAttendance();
                showToast(`Loaded attendance for ${formatDate(this.value)}`, 'info');
            }
        });
    }
    
    // Prevent data loss on page navigation
    window.addEventListener('beforeunload', function (e) {
        const attendanceSection = document.getElementById('attendanceSection');
        if (attendanceSection && attendanceSection.classList.contains('active')) {
            const hasUnsavedChanges = checkForUnsavedChanges();
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        }
    });
}

// ========================================
// NAVIGATION
// ========================================

function showSection(sectionId) {
    // Remove active class from all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section with animation
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Highlight active nav button
    const activeBtn = document.querySelector(`[data-section="${sectionId.replace('Section', '')}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// ATTENDANCE MANAGEMENT
// ========================================

function openAttendance(className) {
    currentClass = className;
    showSection('attendanceSection');
    
    // Update title
    document.getElementById("attendanceTitle").innerText = `${className} Attendance`;
    
    // Set default date if not set
    const dateInput = document.getElementById("attendanceDate");
    if (!dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
    
    // Load attendance data
    loadAttendance();
}

function loadAttendance() {
    if (!currentClass) {
        showToast('No class selected', 'error');
        return;
    }
    
    const date = document.getElementById("attendanceDate").value || new Date().toISOString().slice(0, 10);
    const classData = getClassData(currentClass);
    const students = classData.students || {};
    const records = classData.records || {};
    const dayRecord = records[date] || {};
    
    const tableBody = document.querySelector("#attendanceTable tbody");
    tableBody.innerHTML = "";
    
    // Use DocumentFragment for batch DOM insertion (much faster)
    const fragment = document.createDocumentFragment();
    
    // Create table rows
    for (let i = 1; i <= STUDENT_COUNT; i++) {
        const attendanceValue = dayRecord[i] || "1"; // default 100% present
        const studentName = students[i] || `Student ${i}`;
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="sno">${i}</td>
            <td class="student-name" contenteditable="true" data-index="${i}">${escapeHtml(studentName)}</td>
            <td style="text-align: center;">
                <input type="checkbox" name="att-${i}" value="1" ${attendanceValue === "1" ? "checked" : ""} aria-label="100% present for student ${i}">
            </td>
            <td style="text-align: center;">
                <input type="checkbox" name="att-${i}" value="0.5" ${attendanceValue === "0.5" ? "checked" : ""} aria-label="50% present for student ${i}">
            </td>
            <td style="text-align: center;">
                <input type="checkbox" name="att-${i}" value="0" ${attendanceValue === "0" ? "checked" : ""} aria-label="Absent for student ${i}">
            </td>
        `;
        fragment.appendChild(row);
    }
    
    // Append all rows at once
    tableBody.appendChild(fragment);
    
    // Setup checkbox exclusivity (bug fix: mutual exclusivity)
    setupCheckboxes();
    
    // Setup editable name fields
    setupEditableNames();
}

function setupCheckboxes() {
    const tableBody = document.querySelector("#attendanceTable tbody");
    if (!tableBody) return;
    
    // Use event delegation instead of adding listeners to each checkbox
    tableBody.removeEventListener("change", handleCheckboxChange);
    tableBody.addEventListener("change", handleCheckboxChange);
}

function handleCheckboxChange(e) {
    if (e.target.type === 'checkbox' && e.target.checked) {
        // Uncheck other checkboxes in the same row
        const row = e.target.closest('tr');
        if (row) {
            row.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (cb !== e.target) {
                    cb.checked = false;
                }
            });
        }
    }
}

function setupEditableNames() {
    const tableBody = document.querySelector("#attendanceTable tbody");
    if (!tableBody) return;
    
    // Remove old listeners
    tableBody.removeEventListener("blur", handleNameBlur, true);
    tableBody.removeEventListener("keydown", handleNameKeydown, true);
    
    // Use event delegation with capture phase
    tableBody.addEventListener("blur", handleNameBlur, true);
    tableBody.addEventListener("keydown", handleNameKeydown, true);
}

function handleNameBlur(e) {
    if (!e.target.classList.contains("student-name")) return;
    
    const idx = e.target.getAttribute("data-index");
    const newName = e.target.innerText.trim();
    
    if (newName) {
        const classData = getClassData(currentClass);
        classData.students = classData.students || {};
        classData.students[idx] = newName;
        saveClassData(currentClass, classData);
        showToast('Student name updated', 'success');
    } else {
        e.target.innerText = `Student ${idx}`;
    }
}

function handleNameKeydown(e) {
    if (!e.target.classList.contains("student-name")) return;
    
    if (e.key === "Enter") {
        e.preventDefault();
        e.target.blur();
    }
}

function saveAttendance() {
    if (!currentClass) {
        showToast("Please select a class first", "error");
        return;
    }
    
    const date = document.getElementById("attendanceDate").value || new Date().toISOString().slice(0, 10);
    const classData = getClassData(currentClass);
    classData.students = classData.students || {};
    classData.records = classData.records || {};
    const record = {};
    
    let hasData = false;
    
    // Collect attendance data
    document.querySelectorAll("#attendanceTable tbody tr").forEach(row => {
        const idx = row.querySelector(".sno").innerText.trim();
        const name = row.querySelector(".student-name").innerText.trim();
        const attendanceCheckbox = row.querySelector("input:checked");
        const attendance = attendanceCheckbox ? attendanceCheckbox.value : "0";
        
        // BUG FIX: XSS protection - sanitize before saving
        classData.students[idx] = escapeHtml(name || `Student ${idx}`);
        record[idx] = attendance;
        hasData = true;
    });
    
    if (hasData) {
        // BUG FIX: Better localStorage handling with error catching
        try {
            classData.records[date] = record;
            saveClassData(currentClass, classData);
            showToast(`✅ Attendance saved successfully for ${formatDate(date)}`, "success");
        } catch (error) {
            console.error('Save error:', error);
            showToast("Failed to save attendance. Storage may be full.", "error");
        }
    } else {
        showToast("No attendance data to save", "error");
    }
}

// ========================================
// SEARCH & FILTER
// ========================================

function filterStudents() {
    const search = document.getElementById("searchInput").value.toLowerCase().trim();
    const rows = document.querySelectorAll("#attendanceTable tbody tr");
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(search)) {
            row.style.display = "";
            visibleCount++;
        } else {
            row.style.display = "none";
        }
    });
    
    // Show count of visible students
    if (search) {
        console.log(`Found ${visibleCount} students matching "${search}"`);
    }
}

// ========================================
// EXCEL EXPORT
// ========================================

function exportToExcel() {
    if (!currentClass) {
        showToast("No class selected", "error");
        return;
    }
    
    const date = document.getElementById("attendanceDate").value || new Date().toISOString().slice(0, 10);
    const tableData = [["Register No.", "Student Name", "Attendance Status"]];
    
    document.querySelectorAll("#attendanceTable tbody tr").forEach(row => {
        // Skip hidden rows (from search filter)
        if (row.style.display === "none") return;
        
        const sno = row.querySelector(".sno").innerText;
        const studentName = row.querySelector(".student-name").innerText;
        const attendanceCheckbox = row.querySelector("input:checked");
        const attendance = attendanceCheckbox ? attendanceCheckbox.value : "0";
        
        let status;
        if (attendance === "1") status = "100% Present";
        else if (attendance === "0.5") status = "50% Present";
        else status = "Absent";
        
        tableData.push([sno, studentName, status]);
    });
    
    // BUG FIX: Better error handling for Excel exports
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 15 },
            { wch: 30 },
            { wch: 18 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `${currentClass}_Attendance_${date}.xlsx`);
        
        showToast("📥 Excel file downloaded successfully", "success");
    } catch (error) {
        console.error("Excel export error:", error);
        showToast("Failed to export Excel file. Please try again.", "error");
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getClassData(className) {
    try {
        const data = localStorage.getItem(className);
        return data ? JSON.parse(data) : { students: {}, records: {} };
    } catch (error) {
        console.error('Error reading class data:', error);
        return { students: {}, records: {} };
    }
}

function saveClassData(className, data) {
    try {
        localStorage.setItem(className, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving class data:', error);
        if (error.name === 'QuotaExceededError') {
            showToast('Storage is full. Please clear some old records.', 'error');
        }
        throw error;
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateString;
    }
}

// BUG FIX: XSS protection - HTML escaping
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getPercentageColor(percentage) {
    if (percentage < 25) return '#8B2635';
    if (percentage < 40) return '#A84454';
    return '#D4704F';
}

function checkForUnsavedChanges() {
    // Check if there are any edited but unsaved student names
    const editedNames = document.querySelectorAll("#attendanceTable tbody .student-name[contenteditable='true']");
    // In a real app, you might track this more precisely
    return false; // Simplified for this version
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ========================================
// MOBILE TOUCH IMPROVEMENTS
// ========================================

if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
}

// ========================================
// PERFORMANCE OPTIMIZATION
// ========================================

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to search - properly debounced now
const debouncedFilter = debounce(filterStudents, 300);

// ========================================
// ACCESSIBILITY ENHANCEMENTS
// ========================================

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save attendance
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const attendanceSection = document.getElementById('attendanceSection');
        if (attendanceSection && attendanceSection.classList.contains('active')) {
            saveAttendance();
        }
    }
});

// ========================================
// ERROR BOUNDARY
// ========================================

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});

// ========================================
// INITIALIZATION COMPLETE
// ========================================

console.log('%c✨ All systems ready!', 'color: #D4AF37; font-weight: bold;');
