class MatchingGame {
    constructor() {
        this.pairs = [];
        this.gameItems = [];
        this.selectedItems = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.isProcessing = false;
        this.leftItems = [];
        this.rightItems = [];
        this.loadPairs();
    }

    addPair() {
        const item1 = document.getElementById('item1').value.trim();
        const item2 = document.getElementById('item2').value.trim();
        
        if (!item1 || !item2) {
            alert('Please enter both items for the pair');
            return;
        }
        
        if (item1 === item2) {
            alert('Items in a pair must be different');
            return;
        }
        
        this.pairs.push({ item1, item2 });
        this.savePairs();
        this.updatePairsList();
        this.clearInputs();
        this.updateStartButton();
    }

    updatePairsList() {
        const pairsList = document.getElementById('pairs-list');
        pairsList.innerHTML = '';
        
        this.pairs.forEach((pair, index) => {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'pair-item';
            pairDiv.innerHTML = `
                <span>${pair.item1} ↔ ${pair.item2}</span>
                <button class="remove-btn" onclick="game.removePair(${index})">Remove</button>
            `;
            pairsList.appendChild(pairDiv);
        });
    }

    removePair(index) {
        this.pairs.splice(index, 1);
        this.savePairs();
        this.updatePairsList();
        this.updateStartButton();
    }

    clearInputs() {
        document.getElementById('item1').value = '';
        document.getElementById('item2').value = '';
    }

    updateStartButton() {
        const startBtn = document.getElementById('start-btn');
        startBtn.disabled = this.pairs.length === 0;
    }

    startGame() {
        if (this.pairs.length === 0) return;
        
        // Hide admin panel and show game area
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('game-area').classList.remove('hidden');
        
        this.initializeGame();
    }

    initializeGame() {
        this.gameItems = [];
        this.selectedItems = [];
        this.matchedPairs = 0;
        this.attempts = 0;
        this.isProcessing = false;
        
        // Create game items from pairs
        this.pairs.forEach((pair, pairIndex) => {
            this.gameItems.push({
                text: pair.item1,
                pairIndex: pairIndex,
                id: `${pairIndex}_1`
            });
            this.gameItems.push({
                text: pair.item2,
                pairIndex: pairIndex,
                id: `${pairIndex}_2`
            });
        });
        
        // Shuffle the items
        this.shuffleArray(this.gameItems);
        
        this.renderGameBoard();
        this.updateStats();
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderGameBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        
        // Create two columns
        const leftColumn = document.createElement('div');
        leftColumn.className = 'game-column';
        leftColumn.innerHTML = '<div class="column-header">Column A (Fixed)</div>';
        
        const rightColumn = document.createElement('div');
        rightColumn.className = 'game-column sortable-column';
        rightColumn.innerHTML = '<div class="column-header">Column B (Drag to Reorder)</div>';
        rightColumn.id = 'right-column';
        
        // Separate items into two arrays for each column
        this.leftItems = [];
        this.rightItems = [];
        
        this.pairs.forEach((pair, pairIndex) => {
            this.leftItems.push({
                text: pair.item1,
                pairIndex: pairIndex,
                id: `${pairIndex}_1`,
                column: 'left'
            });
            this.rightItems.push({
                text: pair.item2,
                pairIndex: pairIndex,
                id: `${pairIndex}_2`,
                column: 'right'
            });
        });
        
        // Keep left column in order, shuffle right column
        this.shuffleArray(this.rightItems);
        this.shuffleArray(this.rightItems);
        this.shuffleArray(this.rightItems);
        
        // Add left column items (fixed order)
        this.leftItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'game-item fixed-item';
            itemDiv.textContent = item.text;
            itemDiv.dataset.pairIndex = item.pairIndex;
            leftColumn.appendChild(itemDiv);
        });
        
        // Add right column items (draggable)
        this.rightItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'game-item draggable-item';
            itemDiv.textContent = item.text;
            itemDiv.dataset.pairIndex = item.pairIndex;
            itemDiv.draggable = true;
            
            // Add drag event listeners
            itemDiv.addEventListener('dragstart', this.handleDragStart.bind(this));
            itemDiv.addEventListener('dragover', this.handleDragOver.bind(this));
            itemDiv.addEventListener('drop', this.handleDrop.bind(this));
            itemDiv.addEventListener('dragend', this.handleDragEnd.bind(this));
            
            rightColumn.appendChild(itemDiv);
        });
        
        gameBoard.appendChild(leftColumn);
        gameBoard.appendChild(rightColumn);
    }

    // Drag and drop handlers
    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', '');
        e.target.classList.add('dragging');
        this.draggedElement = e.target;
    }

    handleDragOver(e) {
        e.preventDefault();
        const afterElement = this.getDragAfterElement(e.currentTarget.parentNode, e.clientY);
        const dragging = document.querySelector('.dragging');
        
        if (afterElement == null) {
            e.currentTarget.parentNode.appendChild(dragging);
        } else {
            e.currentTarget.parentNode.insertBefore(dragging, afterElement);
        }
    }

    handleDrop(e) {
        e.preventDefault();
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    checkAnswers() {
        this.attempts++;
        this.updateStats();
        
        const leftItems = document.querySelectorAll('.fixed-item');
        const rightItems = document.querySelectorAll('.draggable-item');
        
        let correctMatches = 0;
        let allCorrect = true;
        
        // Clear previous states
        rightItems.forEach(item => {
            item.classList.remove('matched', 'wrong');
        });
        leftItems.forEach(item => {
            item.classList.remove('matched', 'wrong');
        });
        
        // Check each position
        for (let i = 0; i < leftItems.length; i++) {
            const leftPairIndex = parseInt(leftItems[i].dataset.pairIndex);
            const rightPairIndex = parseInt(rightItems[i].dataset.pairIndex);
            
            if (leftPairIndex === rightPairIndex) {
                leftItems[i].classList.add('matched');
                rightItems[i].classList.add('matched');
                correctMatches++;
            } else {
                leftItems[i].classList.add('wrong');
                rightItems[i].classList.add('wrong');
                allCorrect = false;
            }
        }
        
        this.matchedPairs = correctMatches;
        this.updateStats();
        
        if (allCorrect) {
            setTimeout(() => this.showVictory(), 500);
        } else {
            // Remove wrong styling after 2 seconds
            setTimeout(() => {
                document.querySelectorAll('.wrong').forEach(item => {
                    item.classList.remove('wrong');
                });
            }, 2000);
        }
    }

    updateStats() {
        document.getElementById('matches').textContent = this.matchedPairs;
        document.getElementById('attempts').textContent = this.attempts;
    }

    showVictory() {
        document.getElementById('victory-animation').classList.remove('hidden');
        
        // Hide victory animation after 3 seconds
        setTimeout(() => {
            document.getElementById('victory-animation').classList.add('hidden');
        }, 3000);
    }

    resetGame() {
        // Hide game area and victory animation
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('victory-animation').classList.add('hidden');
        
        // Show admin panel
        document.getElementById('admin-panel').classList.remove('hidden');
        
        // Don't reset pairs - keep them stored
        this.clearInputs();
    }

    // Storage methods
    savePairs() {
        try {
            // Save to localStorage
            localStorage.setItem('matchingGamePairs', JSON.stringify(this.pairs));
            
            // Auto-generate updated JSON file for download
            this.autoSaveToFile();
            
            console.log('Pairs saved successfully:', this.pairs.length, 'pairs');
        } catch (error) {
            console.warn('Could not save pairs:', error);
        }
    }

    autoSaveToFile() {
        // Create updated JSON structure
        const jsonData = {
            pairs: this.pairs,
            lastUpdated: new Date().toISOString(),
            version: "1.0",
            totalPairs: this.pairs.length,
            projectName: "Matching Pairs Game",
            author: "santoshprasad76"
        };

        // Store the JSON data for potential download
        this.currentJsonData = JSON.stringify(jsonData, null, 2);
        
        // Show notification that data is ready for download
        this.showSaveNotification();
    }

    showSaveNotification() {
        // Create or update notification
        let notification = document.getElementById('save-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'save-notification';
            notification.className = 'save-notification';
            document.body.appendChild(notification);
        }

        notification.innerHTML = `
            <div class="notification-content">
                <span>📁 Data updated! ${this.pairs.length} pairs ready</span>
                <button onclick="game.downloadUpdatedFile()" class="download-btn-small">Download JSON</button>
                <button onclick="game.hideSaveNotification()" class="close-btn">×</button>
            </div>
        `;
        
        notification.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (notification) {
                notification.style.display = 'none';
            }
        }, 5000);
    }

    downloadUpdatedFile() {
        if (this.currentJsonData) {
            const dataBlob = new Blob([this.currentJsonData], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'pairs.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.hideSaveNotification();
            console.log('Updated pairs.json downloaded');
        }
    }

    hideSaveNotification() {
        const notification = document.getElementById('save-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }

    async loadPairs() {
        try {
            // First try to load from localStorage
            const savedPairs = localStorage.getItem('matchingGamePairs');
            if (savedPairs) {
                this.pairs = JSON.parse(savedPairs);
                console.log('Loaded pairs from localStorage:', this.pairs.length, 'pairs');
            } else {
                // If no localStorage data, try to load from JSON file
                await this.loadFromFile();
            }
            
            // Update UI after loading
            setTimeout(() => {
                this.updatePairsList();
                this.updateStartButton();
            }, 0);
        } catch (error) {
            console.warn('Could not load pairs:', error);
            this.pairs = [];
        }
    }

    async loadFromFile() {
        try {
            const response = await fetch('data/pairs.json');
            if (response.ok) {
                const data = await response.json();
                this.pairs = data.pairs || [];
                console.log('Loaded pairs from file:', this.pairs.length, 'pairs');
                // Save to localStorage for future use
                this.savePairs();
            }
        } catch (error) {
            console.warn('Could not load pairs from file:', error);
            // Set some default pairs if file loading fails
            this.setDefaultPairs();
        }
    }

    setDefaultPairs() {
        this.pairs = [
            { item1: "Cat", item2: "Meow" },
            { item1: "Dog", item2: "Bark" },
            { item1: "Sun", item2: "Hot" },
            { item1: "Rain", item2: "Wet" },
            { item1: "Fire", item2: "Burn" }
        ];
        console.log('Set default pairs:', this.pairs.length, 'pairs');
        this.savePairs();
    }

    exportPairs() {
        const dataStr = JSON.stringify({
            pairs: this.pairs,
            lastUpdated: new Date().toISOString(),
            version: "1.0"
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'matching-pairs-backup.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Pairs exported successfully');
    }

    async importPairs(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.pairs && Array.isArray(data.pairs)) {
                this.pairs = data.pairs;
                this.savePairs();
                this.updatePairsList();
                this.updateStartButton();
                console.log('Imported pairs successfully:', this.pairs.length, 'pairs');
                alert(`Successfully imported ${this.pairs.length} pairs!`);
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import pairs. Please check the file format.');
        }
    }

    clearAllPairs() {
        if (confirm('Are you sure you want to clear all pairs? This cannot be undone.')) {
            this.pairs = [];
            this.savePairs();
            this.updatePairsList();
            this.updateStartButton();
            this.clearInputs();
        }
    }
}

// Initialize the game
const game = new MatchingGame();

// Global functions for HTML onclick events
function addPair() {
    game.addPair();
}

function startGame() {
    game.startGame();
}

function resetGame() {
    game.resetGame();
}

function clearAllPairs() {
    game.clearAllPairs();
}

function checkAnswers() {
    game.checkAnswers();
}

function exportPairs() {
    game.exportPairs();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (file) {
        game.importPairs(file);
    }
}

// Allow Enter key to add pairs
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('#item1, #item2');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addPair();
            }
        });
    });
});