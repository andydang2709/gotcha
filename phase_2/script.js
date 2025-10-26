// Character configuration
const characterNames = {
    "Pete Barba (Detective Partner)": CONFIG.PETE_BARBA_ID,
    "Stephanie Lazarus (Art Crime Detective)": CONFIG.STEPHANIE_LAZARUS_ID,
    "Tanya Alvarez (Nurse at Sherri's Office)": CONFIG.TANYA_ALVAREZ_ID,
    "Marissa Cole (Neighbor Maid)": CONFIG.MARISSA_COLE_ID
};

// Chat state management
let chats = {};
let currentCharacter = "Pete Barba (Detective Partner)"; // Default to Pete Barba
let allUserMessages = []; // Track all user messages across all conversations
let johnUnlocked = false; // John Ruetten is locked initially
let morganUnlocked = false; // Dr. Morgan is locked initially
let nelsUnlocked = false; // Nels Rasmussen is locked initially
let currentSlide = 1; // Current slide in the incident report slider
let completedProgress = new Set(); // Track completed progress items
let discoveredProgress = new Set(); // Track discovered progress items
let currentPhase = 1; // Current investigation phase
let phase1Complete = false; // Track if phase 1 is complete
let welcomeMessageShown = false; // Track if welcome message has been shown
let characterCooldowns = {}; // Track cooldowns for characters

// DOM elements
const characterSelect = document.getElementById('character-select');
const chatTitle = document.getElementById('chat-title');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const incidentReportBtn = document.getElementById('incident-report-btn');
const incidentModal = document.getElementById('incident-modal');
const prevSlideBtn = document.getElementById('prev-slide');
const nextSlideBtn = document.getElementById('next-slide');
const indicators = document.querySelectorAll('.indicator');
const slides = document.querySelectorAll('.slide');
const landingPage = document.getElementById('landing-page');
const startButton = document.getElementById('start-investigation');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeChats();
    setupEventListeners();
    
    // Set Pete Barba as the default selected character
    characterSelect.value = currentCharacter;
    updateChatDisplay();
    
    // Welcome message will be added when user clicks "Start Investigation"
});

// Initialize chat data for all characters
function initializeChats() {
    Object.keys(characterNames).forEach(character => {
        chats[character] = {
            messages: [],
            sessionId: ""
        };
    });
}

// Check for Dr. Morgan unlock action in API response
function checkForMorganUnlock(data) {
    // Function kept for compatibility but not used in Phase 2
}

// Check for Nels unlock action in API response
function checkForNelsUnlock(data) {
    // Function kept for compatibility but not used in Phase 2
}

// Check for progress actions in API response
function checkProgressActions(data) {
    const action = data.action;
    
    // Define action mappings to progress items
    const actionMappings = {
        'STACKED_STEREO': 'stereo player',
        'JEWELRY_BOX': 'jewelry box',
        'BLOOD_MARKS': 'blood marks',
        'REVEALS_TANYA_ALIBI': 'remove tanya',
        'REVEALS_TANYA_DNA_TEST': 'remove tanya',
        'REVEALS_MARISSA_ALIBI': 'remove marissa'
    };
    
    // Check if the action matches any of our progress items
    if (action && actionMappings[action]) {
        const keyword = actionMappings[action];
        
        // First, discover the item if not already discovered
        if (!discoveredProgress.has(keyword)) {
            discoveredProgress.add(keyword);
            discoverProgressItem(keyword);
            
            // Check if Phase 1 is complete after discovering new item
            // checkPhase1Completion();
        }
        
        // Then complete it if not already completed
        if (!completedProgress.has(keyword)) {
            completedProgress.add(keyword);
            updateProgressItem(keyword);
        }
    }
}

// Check for REFUSE_TO_ANSWER action in API response
function checkForRefuseToAnswer(data) {
    const action = data.action;
    
    if (action === 'REFUSE_TO_ANSWER') {
        // Set cooldown on the current character
        setCharacterCooldown(currentCharacter, 60000); // 1 minute in milliseconds
        
        // If the user is chatting with Stephanie, show message and switch to Pete
        if (currentCharacter === "Stephanie Lazarus (Art Crime Detective)") {
            setTimeout(() => {
                // Switch to Pete Barba
                currentCharacter = "Pete Barba (Detective Partner)";
                characterSelect.value = currentCharacter;
                updateChatDisplay();
            }, 500);
        }
    }
}

// Set cooldown for a character
function setCharacterCooldown(characterName, duration) {
    characterCooldowns[characterName] = Date.now() + duration;
    
    // Disable the character in the selector
    const option = Array.from(characterSelect.options).find(opt => opt.value === characterName);
    if (option) {
        option.disabled = true;
        option.style.opacity = '0.5';
    }
    
    // Show notification
    showCooldownNotification(characterName, duration);
    
    // After cooldown period, re-enable the character
    setTimeout(() => {
        delete characterCooldowns[characterName];
        if (option) {
            option.disabled = false;
            option.style.opacity = '1';
        }
    }, duration);
}

// Show cooldown notification
function showCooldownNotification(characterName, duration) {
    const characterDisplayName = characterName.split('(')[0].trim();
    const minutes = Math.ceil(duration / 60000);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b 0%, #785589 100%);
        color: #dcd6f7;
        padding: 15px 20px;
        border-radius: 10px;
        border: 2px solid #ff6b6b;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.5s ease-out;
        max-width: 300px;
    `;
    notification.textContent = `⚠️ You have annoyed ${characterDisplayName}. She won't answer any of your questions for the next ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

// Check if a character is on cooldown
function isCharacterOnCooldown(characterName) {
    return characterCooldowns[characterName] && Date.now() < characterCooldowns[characterName];
}

// Check for keywords in messages and update progress
function checkProgressKeywords(message, sender) {
    const messageText = message.toLowerCase();
    
    // Define keyword mappings - using more specific terms to avoid false positives
    const keywordMappings = {
        'stereo player': ['stack', 'stacked', 'properly stacked', 'untoppled'],
        'jewelry box': ['jewelry', 'jewelry box', 'jewelry box was not stolen'],
        'blood marks': ['thumb', 'blood', 'fingerprint'],
    };
    
    // Check each keyword group
    Object.keys(keywordMappings).forEach(keyword => {
        const keywords = keywordMappings[keyword];
        const found = keywords.some(kw => {
            // Use word boundaries to prevent partial matches, but handle special cases like .38
            let pattern = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // For patterns starting with numbers or special chars, use more flexible matching
            if (/^[0-9.]/.test(kw)) {
                // For patterns like ".38", use lookahead/lookbehind for word boundaries
                pattern = `(?<=\\W|^)${pattern}(?=\\W|$)`;
            } else {
                // For normal words, use standard word boundaries
                pattern = `\\b${pattern}\\b`;
            }
            const regex = new RegExp(pattern, 'i');
            return regex.test(messageText);
        });
        
        if (found) {
            // First, discover the item if not already discovered
            if (!discoveredProgress.has(keyword)) {
                discoveredProgress.add(keyword);
                discoverProgressItem(keyword);
                
                // Check if Phase 1 is complete after discovering new item
                // checkPhase1Completion();
            }
            
            // Then complete it if not already completed
            if (!completedProgress.has(keyword)) {
                completedProgress.add(keyword);
                updateProgressItem(keyword);
            }
        }
    });
}

// Discover progress item in the UI
function discoverProgressItem(keyword) {
    const progressItem = document.querySelector(`[data-keyword="${keyword}"]`);
    if (progressItem && !progressItem.classList.contains('discovered')) {
        progressItem.classList.add('discovered');
        
        // Add a discovery animation
        progressItem.style.animation = 'progressDiscover 0.6s ease-out';
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#progress-discover-style')) {
            const style = document.createElement('style');
            style.id = 'progress-discover-style';
            style.textContent = `
                @keyframes progressDiscover {
                    0% { 
                        transform: scale(1); 
                        background: rgba(120, 85, 137, 0.1);
                    }
                    50% { 
                        transform: scale(1.03); 
                        background: rgba(120, 85, 137, 0.3);
                        box-shadow: 0 0 15px rgba(120, 85, 137, 0.4);
                    }
                    100% { 
                        transform: scale(1); 
                        background: rgba(120, 85, 137, 0.1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Update progress item in the UI
function updateProgressItem(keyword) {
    const progressItem = document.querySelector(`[data-keyword="${keyword}"]`);
    if (progressItem && !progressItem.classList.contains('completed')) {
        progressItem.classList.add('completed');
        progressItem.querySelector('.checkbox').textContent = '☑';
        
        // Add a subtle animation
        progressItem.style.animation = 'progressComplete 0.5s ease-out';
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#progress-animation-style')) {
            const style = document.createElement('style');
            style.id = 'progress-animation-style';
            style.textContent = `
                @keyframes progressComplete {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); background: rgba(120, 85, 137, 0.3); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Check if Phase 2 is complete after completing new item
        checkPhase2Completion();
        
        // Check if the entire game (including suspect eliminations) is complete
        checkGameCompletion();
    }
}

// Show notification that new characters are unlocked
function showNewCharactersNotification() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #785589 0%, #000000 100%);
        color: #dcd6f7;
        padding: 15px 20px;
        border-radius: 10px;
        border: 2px solid #785589;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.5s ease-out;
    `;
    notification.textContent = '🔓 New characters are now available to speak with!';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 4000);
}

// Add new characters to character selection
function addNewCharactersToSelect() {
    const newCharacters = [
        { value: 'Stephanie Lazarus (Art Crime Detective)', text: 'Stephanie Lazarus (Art Crime Detective)' },
        { value: 'Tanya Alvarez (Nurse at Sherri\'s Office)', text: 'Tanya Alvarez (Nurse at Sherri\'s Office)' },
        { value: 'Marissa Cole (Neighbor Maid)', text: 'Marissa Cole (Neighbor Maid)' }
    ];
    
    newCharacters.forEach(char => {
        // Check if character already exists
        const existingOption = Array.from(characterSelect.options).find(opt => opt.value === char.value);
        if (existingOption) return;
        
        // Initialize chat for this character if not already initialized
        if (!chats[char.value]) {
            chats[char.value] = {
                messages: [],
                sessionId: ""
            };
        }
        
        const option = document.createElement('option');
        option.value = char.value;
        option.textContent = char.text;
        option.style.color = '#785589'; // Highlight the new options
        
        characterSelect.appendChild(option);
    });
}

// Check if both "stereo player" and "jewelry box" are completed to trigger Pete's zoom message
function checkForStereoPlayerZoom() {
    const stereoPlayerCompleted = completedProgress.has('stereo player');
    const jewelryBoxCompleted = completedProgress.has('jewelry box');
    
    if (stereoPlayerCompleted && jewelryBoxCompleted) {
        // Check if we've already sent this message to avoid duplicates
        const peteChat = chats["Pete Barba (Detective Partner)"];
        const hasZoomMessage = peteChat.messages.some(msg => 
            msg.sender === 'bot' && 
            msg.message.includes("Let's zoom into the stereo player") &&
            msg.imagePath === 'crime_scene_zoomed.png'
        );
        
        if (!hasZoomMessage) {
            // Add Pete's zoom message
            const zoomMessage = {
                sender: 'bot',
                message: "Let's zoom into the stereo player. See anything strange?",
                imagePath: 'crime_scene_zoomed.png'
            };
            
            peteChat.messages.push(zoomMessage);
            
            // If Pete is currently selected, update the display
            if (currentCharacter === "Pete Barba (Detective Partner)") {
                addMessageToDisplay('bot', zoomMessage.message, zoomMessage.imagePath);
            }
        }
    }
}

// Check if we should send Pete's zoom message after the bot response
function checkForStereoPlayerZoomAfterResponse() {
    const stereoPlayerCompleted = completedProgress.has('stereo player');
    const jewelryBoxCompleted = completedProgress.has('jewelry box');
    
    if (stereoPlayerCompleted && jewelryBoxCompleted) {
        // Check if we've already sent this message to avoid duplicates
        const peteChat = chats["Pete Barba (Detective Partner)"];
        const hasZoomMessage = peteChat.messages.some(msg => 
            msg.sender === 'bot' && 
            msg.message.includes("Let's zoom into the stereo player") &&
            msg.imagePath === 'crime_scene_zoomed.png'
        );
        
        if (!hasZoomMessage) {
            // Add Pete's zoom message after a short delay
            setTimeout(() => {
                const zoomMessage = {
                    sender: 'bot',
                    message: "Let's zoom into the stereo player. See anything strange?",
                    imagePath: 'crime_scene_zoomed.png'
                };
                
                peteChat.messages.push(zoomMessage);
                
                // If Pete is currently selected, update the display
                if (currentCharacter === "Pete Barba (Detective Partner)") {
                    addMessageToDisplay('bot', zoomMessage.message, zoomMessage.imagePath);
                }
            }, 2000); // 2 second delay after the bot response
        }
    }
}

// Check if Phase 2 is complete and unlock new characters
function checkPhase2Completion() {
    // Define all Phase 2 progress items
    const phase2Items = ['stereo player', 'jewelry box', 'blood marks'];
    
    // Check if all items are completed
    const allCompleted = phase2Items.every(item => completedProgress.has(item));
    
    if (allCompleted) {
        // Add Pete's completion message
        const peteChat = chats["Pete Barba (Detective Partner)"];
        const hasCompletionMessage = peteChat.messages.some(msg => 
            msg.sender === 'bot' && 
            msg.message.includes("Great! From all of those clues")
        );
        
        if (!hasCompletionMessage) {
            setTimeout(() => {
                const completionMessage = {
                    sender: 'bot',
                    message: "Great! From all of those clues, I've finalized it down into 3 potential female suspects: Stephanie Lazarus, Tanya Alvarez, and Marissa Cole. Can you talk to them to find out more?"
                };                
                
                peteChat.messages.push(completionMessage);
                
                // If Pete is currently selected, update the display
                if (currentCharacter === "Pete Barba (Detective Partner)") {
                    addMessageToDisplay('bot', completionMessage.message);
                }
                
                // Show notification and add new characters
                showNewCharactersNotification();
                addNewCharactersToSelect();
            }, 2000);
        }
    }
}

// Check if all investigation items including suspects are complete
function checkGameCompletion() {
    // Define all investigation items including suspect removals
    const allInvestigationItems = [
        'stereo player', 
        'jewelry box', 
        'blood marks',
        'remove tanya',
        'remove marissa'
    ];
    
    // Check if all items are completed
    const allCompleted = allInvestigationItems.every(item => completedProgress.has(item));
    
    if (allCompleted) {
        // Show congratulations popup and endgame
        showEndgameScreen();
    }
}

// Show congratulations popup and endgame screen
function showEndgameScreen() {
    // Check if we've already shown the endgame to avoid duplicates
    if (document.getElementById('endgame-overlay')) {
        return;
    }
    
    // Create endgame overlay
    const overlay = document.createElement('div');
    overlay.id = 'endgame-overlay';
    overlay.className = 'endgame-overlay';
    
    overlay.innerHTML = `
        <div class="endgame-content">
            <div class="endgame-header">
                <h1>🎉 Congratulations!</h1>
                <h2>You've Solved the Case!</h2>
            </div>
            <div class="endgame-body">
                <p class="endgame-message">
                    Through process of elimination, you have uncovered Stephanie to be the real culprit.
                </p>
                <p class="endgame-details">
                    Your investigation has come to a successful conclusion. You've gathered all the evidence and eliminated the other suspects, leaving <strong>Stephanie Lazarus</strong> as the true perpetrator of this crime.
                </p>
                <div class="endgame-stats">
                    <h3>Investigation Summary</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Evidence Collected:</span>
                            <span class="stat-value">3 pieces</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Suspects Interviewed:</span>
                            <span class="stat-value">5 characters</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Suspects Eliminated:</span>
                            <span class="stat-value">2 suspects</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="endgame-footer">
                <button id="endgame-close" class="endgame-button">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Add CSS for endgame screen if not already added
    addEndgameStyles();
    
    // Set up close button
    const closeBtn = document.getElementById('endgame-close');
    closeBtn.addEventListener('click', function() {
        overlay.remove();
        document.body.style.overflow = 'auto';
    });
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus on the overlay for accessibility
    overlay.focus();
}

// Add endgame styles
function addEndgameStyles() {
    if (document.getElementById('endgame-styles')) {
        return; // Styles already added
    }
    
    const style = document.createElement('style');
    style.id = 'endgame-styles';
    style.textContent = `
        .endgame-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 5000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeInEndgame 0.5s ease-out;
        }
        
        @keyframes fadeInEndgame {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        .endgame-content {
            background: linear-gradient(135deg, #000000 0%, #785589 100%);
            border: 3px solid #785589;
            border-radius: 20px;
            max-width: 600px;
            width: 90%;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            animation: slideUpEndgame 0.6s ease-out;
            color: #dcd6f7;
        }
        
        @keyframes slideUpEndgame {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .endgame-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .endgame-header h1 {
            font-size: 2.5rem;
            margin: 0 0 10px 0;
            color: #dcd6f7;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .endgame-header h2 {
            font-size: 1.5rem;
            margin: 0;
            color: #785589;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .endgame-body {
            margin-bottom: 30px;
        }
        
        .endgame-message {
            font-size: 1.3rem;
            text-align: center;
            margin-bottom: 20px;
            font-weight: 600;
            color: #dcd6f7;
            line-height: 1.6;
        }
        
        .endgame-details {
            font-size: 1rem;
            text-align: center;
            margin-bottom: 30px;
            color: #dcd6f7;
            opacity: 0.9;
            line-height: 1.6;
        }
        
        .endgame-stats {
            background: rgba(120, 85, 137, 0.1);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(120, 85, 137, 0.3);
        }
        
        .endgame-stats h3 {
            text-align: center;
            margin: 0 0 20px 0;
            font-size: 1.2rem;
            color: #dcd6f7;
        }
        
        .stats-grid {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: rgba(120, 85, 137, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(120, 85, 137, 0.2);
        }
        
        .stat-label {
            font-weight: 500;
            color: #dcd6f7;
        }
        
        .stat-value {
            font-weight: 700;
            color: #785589;
        }
        
        .endgame-footer {
            text-align: center;
        }
        
        .endgame-button {
            background: linear-gradient(135deg, #785589 0%, #000000 100%);
            color: #dcd6f7;
            border: 2px solid #785589;
            padding: 15px 40px;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .endgame-button:hover {
            background: linear-gradient(135deg, #dcd6f7 0%, #785589 100%);
            color: #000000;
            border-color: #dcd6f7;
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(120, 85, 137, 0.4);
        }
        
        @media (max-width: 768px) {
            .endgame-content {
                padding: 30px 20px;
            }
            
            .endgame-header h1 {
                font-size: 2rem;
            }
            
            .endgame-header h2 {
                font-size: 1.2rem;
            }
            
            .endgame-message {
                font-size: 1.1rem;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Setup event listeners
function setupEventListeners() {
    // Character selection change
    characterSelect.addEventListener('change', function() {
        currentCharacter = this.value;
        updateChatDisplay();
    });

    // Send message on button click
    sendButton.addEventListener('click', sendMessage);

    // Send message on Enter key press
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Landing page event listeners
    startButton.addEventListener('click', startInvestigation);
    
    // Incident report modal event listeners
    incidentReportBtn.addEventListener('click', openIncidentModal);
    // No close button - users must click through all slides and click Finish
    
    // Slider event listeners
    prevSlideBtn.addEventListener('click', previousSlide);
    nextSlideBtn.addEventListener('click', handleNextOrFinish);
    
    // Indicator click listeners
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToSlide(index + 1));
    });
    
    // Keyboard navigation for slider
    document.addEventListener('keydown', function(e) {
        if (incidentModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                previousSlide();
            } else if (e.key === 'ArrowRight') {
                handleNextOrFinish();
            }
        }
    });
}

// Start investigation - hide landing page and open incident report
function startInvestigation() {
    // Hide landing page with fade out effect
    landingPage.style.opacity = '0';
    landingPage.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
        landingPage.classList.add('hidden');
        // Open incident report modal
        openIncidentModal();
    }, 500);
}

// Open incident report modal
function openIncidentModal() {
    incidentModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    // Initialize slider to first slide
    goToSlide(1);
}

// Close incident report modal
function closeIncidentModal() {
    incidentModal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
    // Reset slider to first slide when closing
    goToSlide(1);
    
    // Show welcome message after user closes the incident report for the first time
    if (!welcomeMessageShown) {
        welcomeMessageShown = true;
        setTimeout(() => {
            addWelcomeMessages();
        }, 1000); // 2 seconds after closing the incident report
    }
}

// Slider functions
function goToSlide(slideNumber) {
    // Remove active class from all slides and indicators
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // Add active class to current slide and indicator
    slides[slideNumber - 1].classList.add('active');
    indicators[slideNumber - 1].classList.add('active');
    
    currentSlide = slideNumber;
    
    // Update button states and text
    prevSlideBtn.disabled = slideNumber === 1;
    
    if (slideNumber === slides.length) {
        // Last slide - show Finish button
        nextSlideBtn.textContent = 'Finish';
        nextSlideBtn.id = 'finish-slide';
        nextSlideBtn.disabled = false;
    } else {
        // Not last slide - show Next button
        nextSlideBtn.textContent = 'Next →';
        nextSlideBtn.id = 'next-slide';
        nextSlideBtn.disabled = false;
    }
}

function handleNextOrFinish() {
    if (currentSlide === slides.length) {
        // On last slide - finish and close modal
        closeIncidentModal();
    } else {
        // Not on last slide - go to next slide
        nextSlide();
    }
}

function nextSlide() {
    if (currentSlide < slides.length) {
        goToSlide(currentSlide + 1);
    }
}

function previousSlide() {
    if (currentSlide > 1) {
        goToSlide(currentSlide - 1);
    }
}

// Update chat display for current character
function updateChatDisplay() {
    if (!currentCharacter) {
        chatTitle.textContent = "Select a character to start chatting";
        chatMessages.innerHTML = '<div class="message bot"><div class="message-content">Please select a character from the dropdown above to begin your conversation.</div></div>';
        return;
    }
    
    const characterDisplayName = currentCharacter.split('(')[0].trim();
    chatTitle.textContent = `Chat with ${characterDisplayName}`;
    
    // Clear existing messages
    chatMessages.innerHTML = '';
    
    // Display messages for current character
    const currentChat = chats[currentCharacter];
    currentChat.messages.forEach(msg => {
        addMessageToDisplay(msg.sender, msg.message, msg.imagePath);
    });
    
    // Scroll to bottom
    scrollToBottom();
}

// Add message to chat display
function addMessageToDisplay(sender, message, imagePath = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const senderDiv = document.createElement('div');
    senderDiv.className = 'message-sender';
    senderDiv.textContent = sender === 'user' ? 'You' : currentCharacter.split('(')[0].trim();
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(contentDiv);
    
    // Add image if provided
    if (imagePath) {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'message-image';
        imageDiv.style.cssText = `
            margin-top: 10px;
            text-align: center;
        `;
        
        const img = document.createElement('img');
        img.src = imagePath;
        img.style.cssText = `
            max-width: 100%;
            max-height: 400px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            cursor: pointer;
        `;
        
        // Add click to enlarge functionality
        img.addEventListener('click', function() {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            `;
            
            const enlargedImg = document.createElement('img');
            enlargedImg.src = imagePath;
            enlargedImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                border-radius: 8px;
            `;
            
            modal.appendChild(enlargedImg);
            document.body.appendChild(modal);
            
            modal.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
        
        imageDiv.appendChild(img);
        messageDiv.appendChild(imageDiv);
    }
    
    chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message function
async function sendMessage() {
    const userInput = messageInput.value.trim();
    if (!userInput) return;
    
    if (!currentCharacter) {
        alert("Please select a character first!");
        return;
    }
    
    // Check if current character is on cooldown
    if (isCharacterOnCooldown(currentCharacter)) {
        const characterDisplayName = currentCharacter.split('(')[0].trim();
        const remainingTime = characterCooldowns[currentCharacter] - Date.now();
        const minutes = Math.ceil(remainingTime / 60000);
        alert(`${characterDisplayName} won't talk to you right now. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
        return;
    }

    // Track all user messages
    allUserMessages.push({
        character: currentCharacter,
        message: userInput,
        timestamp: new Date().toISOString()
    });
    
    // Add user message to display
    addMessageToDisplay('user', userInput);
    
    // Add user message to chat data
    chats[currentCharacter].messages.push({
        sender: 'user',
        message: userInput
    });
    
    // Don't check progress keywords in user messages - only check bot messages

    // Clear input and disable input/send button while waiting for response
    messageInput.value = '';
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.style.opacity = '0.5';
    messageInput.style.opacity = '0.5';

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot';
    loadingDiv.innerHTML = `
        <div class="message-sender">${currentCharacter.split('(')[0].trim()}</div>
        <div class="message-content">
            <div class="loading"></div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();

    try {
        // Get character ID from config
        const characterId = characterNames[currentCharacter];
        if (!characterId || characterId.startsWith("your_")) {
            throw new Error(`Please configure the ${currentCharacter} ID in config.js file.`);
        }

        // Determine API key based on character
        let apiKey = CONFIG.API_KEY_2; // Default
        
        if (currentCharacter === "Stephanie Lazarus (Art Crime Detective)") {
            apiKey = CONFIG.API_KEY_2;
        } else if (currentCharacter === "Tanya Alvarez (Nurse at Sherri's Office)" || 
                   currentCharacter === "Marissa Cole (Neighbor Maid)") {
            apiKey = CONFIG.API_KEY_3;
        }

        // Prepare API request
        const payload = {
            sessionId: chats[currentCharacter].sessionId,
            characterId: characterId,
            message: userInput
        };

        const response = await fetch('https://neocortex.link/api/v2/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Debug: Print API response
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        // Check for Dr. Morgan unlock action
        checkForMorganUnlock(data);
        
        // Check for Nels unlock action
        checkForNelsUnlock(data);
        
        // Check for REFUSE_TO_ANSWER action
        checkForRefuseToAnswer(data);

        // Update session ID
        chats[currentCharacter].sessionId = data.sessionId || '';

        // Get bot reply
        const botReply = data.response || "Sorry, I didn't get that.";
        
        // Check for progress actions in API response
        checkProgressActions(data);

        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);

        // Add bot message to display
        addMessageToDisplay('bot', botReply);

        // Add bot message to chat data
        chats[currentCharacter].messages.push({
            sender: 'bot',
            message: botReply
        });
        
        // Check if we should send Pete's zoom message after the bot response
        checkForStereoPlayerZoomAfterResponse();
        
        // Re-enable input and send button
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        messageInput.style.opacity = '1';
        messageInput.focus(); // Focus back on input for next message

    } catch (error) {
        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);
        
        // Re-enable input and send button even on error
        messageInput.disabled = false;
        sendButton.disabled = false;
        sendButton.style.opacity = '1';
        messageInput.style.opacity = '1';
        messageInput.focus();

        // Show error message
        const errorMessage = `Error: ${error.message}`;
        
        addMessageToDisplay('bot', errorMessage);
        
        chats[currentCharacter].messages.push({
            sender: 'bot',
            message: errorMessage
        });
    }
}


// Utility function to format timestamps (optional enhancement)
function formatTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Add some initial welcome messages for each character
function addWelcomeMessages() {
    const welcomeMessages = {
        "Pete Barba (Detective Partner)": "Hey Jim! Let's get this review started. Can you review this picture and tell me what looks odd to you?"
    };

    Object.keys(characterNames).forEach(character => {
        // Only add welcome message if one exists for this character
        if (chats[character].messages.length === 0 && welcomeMessages[character]) {
            chats[character].messages.push({
                sender: 'bot',
                message: welcomeMessages[character],
                imagePath: 'crime_scene.png'
            });
            
            // If this is the current character, update the display immediately
            if (character === currentCharacter) {
                updateChatDisplay();
            }
        }
    });
}

// Function to display all user messages (for debugging/tracking)
function displayAllUserMessages() {
    // console.log('All User Messages:', allUserMessages);
    return allUserMessages;
}

// Function to get message count by character
function getMessageCountByCharacter() {
    const counts = {};
    allUserMessages.forEach(msg => {
        counts[msg.character] = (counts[msg.character] || 0) + 1;
    });
    return counts;
}

// Make functions available globally for debugging
window.debugMessages = displayAllUserMessages;
window.getMessageCounts = getMessageCountByCharacter;