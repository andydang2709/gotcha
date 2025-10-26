// Character configuration
const characterNames = {
    "Dr. Morgan": CONFIG.DR_MORGAN_ID,
    "John Ruetten (Husband)": CONFIG.JOHN_RUETTEN_ID,
    "Steve Hooks (Detective Partner)": CONFIG.STEVE_HOOKS_ID,
    "Nels Rasmussen (Father)": CONFIG.NELS_RASMUSSEN_ID
};

// Chat state management
let chats = {};
let currentCharacter = "Steve Hooks (Detective Partner)"; // Default to Steve Hooks
let allUserMessages = []; // Track all user messages across all conversations
let johnUnlocked = false; // John Ruetten is locked initially
let morganUnlocked = false; // Dr. Morgan is locked initially
let nelsUnlocked = false; // Nels Rasmussen is locked initially
let currentSlide = 1; // Current slide in the incident report slider
let completedProgress = new Set(); // Track completed progress items
let discoveredProgress = new Set(); // Track discovered progress items
let currentPhase = 1; // Current investigation phase
let phase1Complete = false; // Track if phase 1 is complete

// DOM elements
const characterSelect = document.getElementById('character-select');
const chatTitle = document.getElementById('chat-title');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const incidentReportBtn = document.getElementById('incident-report-btn');
const incidentModal = document.getElementById('incident-modal');
const closeModal = document.querySelector('.close');
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
    
    // Set Steve Hooks as the default selected character
    characterSelect.value = currentCharacter;
    updateChatDisplay();
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
    if (data.action === "TALK_TO_MORGAN" && !morganUnlocked) {
        morganUnlocked = true;
        addMorganToCharacterSelect();
        showMorganUnlockNotification();
    }
}

// Check for Nels unlock action in API response
function checkForNelsUnlock(data) {
    if (data.action === "TALK_TO_NELS_AND_JOHN" && !nelsUnlocked) {
        nelsUnlocked = true;
        addNelsToCharacterSelect();
        showNelsUnlockNotification();
        
        // Also unlock John Ruetten when Nels is unlocked
        if (!johnUnlocked) {
            johnUnlocked = true;
            addJohnToCharacterSelect();
        }
    }
}

// Add Dr. Morgan to character selection
function addMorganToCharacterSelect() {
    const morganOption = document.createElement('option');
    morganOption.value = 'Dr. Morgan';
    morganOption.textContent = 'Dr. Alex Morgan (Forensic Pathologist)';
    morganOption.style.color = '#785589'; // Highlight the new option
    
    // Insert as the first option after the default
    const defaultOption = characterSelect.querySelector('option[value=""]');
    characterSelect.insertBefore(morganOption, defaultOption.nextSibling);
}

// Add John Ruetten to character selection
function addJohnToCharacterSelect() {
    const johnOption = document.createElement('option');
    johnOption.value = 'John Ruetten (Husband)';
    johnOption.textContent = 'John Ruetten (Sherri\'s Husband)';
    johnOption.style.color = '#785589'; // Highlight the new option
    
    // Insert after the default option
    const defaultOption = characterSelect.querySelector('option[value=""]');
    characterSelect.insertBefore(johnOption, defaultOption.nextSibling);
}

// Add Nels Rasmussen to character selection
function addNelsToCharacterSelect() {
    const nelsOption = document.createElement('option');
    nelsOption.value = 'Nels Rasmussen (Father)';
    nelsOption.textContent = 'Nels Rasmussen (Sherri\'s Father)';
    nelsOption.style.color = '#785589'; // Highlight the new option
    
    // Add at the end of the character list
    characterSelect.appendChild(nelsOption);
}

// Show notification that Dr. Morgan is unlocked
function showMorganUnlockNotification() {
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
    notification.textContent = '🔓 Dr. Alex Morgan is now available for consultation!';
    
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

// Show notification that Nels Rasmussen is unlocked
function showNelsUnlockNotification() {
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
    notification.textContent = '🔓 Nels Rasmussen and John Ruetten are now available to speak with!';
    
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

// Check for keywords in messages and update progress
function checkProgressKeywords(message, sender) {
    const messageText = message.toLowerCase();
    
    // Define keyword mappings - using more specific terms to avoid false positives
    const keywordMappings = {
        'bullet holes': ['.38', '.38 caliber', '.38 caliber bullet', '.38 caliber bullet hole', '.38 caliber bullet holes'],
        'bite marks': ['bite marks', 'bite mark', 'bite marks on body', 'bite mark on body'],
        'harassment': ['harass', 'harassment', 'harassed', 'harassing', 'harassment of', 'harassed by', 'stalking', 'stalker', 'stalker behavior', 'stalker behavior of', 'stalker behavior of Stephanie Lazarus', 'stalk', 'stalked', 'stalking Stephanie Lazarus', 'stalking Stephanie Lazarus of', 'stalking Stephanie Lazarus of the victim'],
        'lost car': ['burglar', 'burglary', 'burglaries', 'theft', 'stolen'],
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
                checkPhase1Completion();
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
    }
}

// Check if Phase 1 is complete and show completion button
function checkPhase1Completion() {
    // Define all Phase 1 progress items
    const phase1Items = [
        'bullet holes', 'bite marks', 'harassment', 'lost car'
    ];
    
    // Check if all items are discovered
    const allDiscovered = phase1Items.every(item => discoveredProgress.has(item));
    
    if (allDiscovered && !phase1Complete) {
        showPhase1CompletionButton();
    }
}

// Show Phase 1 completion button
function showPhase1CompletionButton() {
    // Create completion button
    const completionButton = document.createElement('div');
    completionButton.id = 'phase1-completion';
    completionButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #785589 0%, #000000 100%);
        color: #dcd6f7;
        padding: 20px 30px;
        border-radius: 15px;
        border: 2px solid #785589;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        z-index: 1000;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: phaseComplete 0.8s ease-out;
        max-width: 300px;
        text-align: center;
    `;
    
    completionButton.innerHTML = `
        <div style="font-size: 1.2rem; margin-bottom: 10px;">🎉 Phase 1 Complete!</div>
        <div style="font-size: 0.9rem; margin-bottom: 15px;">All clues discovered. Ready to move to Phase 2?</div>
        <button id="start-phase2" style="
            background: linear-gradient(135deg, #dcd6f7 0%, #785589 100%);
            color: #000000;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
        ">Start Phase 2</button>
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes phaseComplete {
            0% { 
                opacity: 0; 
                transform: translateY(100px) scale(0.8); 
            }
            50% { 
                opacity: 0.8; 
                transform: translateY(-10px) scale(1.05); 
            }
            100% { 
                opacity: 1; 
                transform: translateY(0) scale(1); 
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(completionButton);
    
    // Add event listener for Phase 2 button
    const phase2Button = document.getElementById('start-phase2');
    phase2Button.addEventListener('click', startPhase2);
    
    // Add hover effects
    phase2Button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 15px rgba(220, 214, 247, 0.4)';
    });
    
    phase2Button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    });
    
    phase1Complete = true;
}

// Start Phase 2
function startPhase2() {
    // Remove Phase 1 completion button
    const completionButton = document.getElementById('phase1-completion');
    if (completionButton) {
        completionButton.remove();
    }
    
    // Update phase
    currentPhase = 2;
    
    // Navigate directly to Phase 2
    navigateToPhase2();
}

// Navigate directly to Phase 2
function navigateToPhase2() {
    window.location.href = 'phase_2';
}

// Show Phase 1 return message
function showPhase1ReturnMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
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
    message.textContent = 'Phase 2 coming soon! Continuing with Phase 1 investigation...';
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 4000);
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
    closeModal.addEventListener('click', closeIncidentModal);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(e) {
        if (e.target === incidentModal) {
            closeIncidentModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && incidentModal.style.display === 'flex') {
            closeIncidentModal();
        }
    });
    
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
        addMessageToDisplay(msg.sender, msg.message);
    });
    
    // Scroll to bottom
    scrollToBottom();
}

// Add message to chat display
function addMessageToDisplay(sender, message) {
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
    
    // // Check for progress keywords in user message
    // checkProgressKeywords(userInput, 'user');

    // Clear input
    messageInput.value = '';

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
        let apiKey;
        if (currentCharacter.startsWith("Steve") || currentCharacter.startsWith("John") || currentCharacter.startsWith("Dr.")) {
            apiKey = CONFIG.API_KEY_1;
        } else {
            apiKey = CONFIG.API_KEY_2;
        }

        if (!apiKey || apiKey.startsWith("your_")) {
            throw new Error(`Please configure the API key for ${currentCharacter} in config.js file.`);
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

        // Update session ID
        chats[currentCharacter].sessionId = data.sessionId || '';

        // Get bot reply
        const botReply = data.response || "Sorry, I didn't get that.";
        
        // Check for progress keywords in bot message
        checkProgressKeywords(botReply, 'bot');

        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);

        // Add bot message to display
        addMessageToDisplay('bot', botReply);

        // Add bot message to chat data
        chats[currentCharacter].messages.push({
            sender: 'bot',
            message: botReply
        });

    } catch (error) {
        // Remove loading indicator
        chatMessages.removeChild(loadingDiv);

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
        "Dr. Morgan": "Hello! I'm Dr. Alex Morgan, a forensic pathologist. I can help you understand the medical aspects of this case. What would you like to know?",
        "John Ruetten (Husband)": "Hi there. I'm John Ruetten, the husband in this case. I'm here to answer any questions you might have about what happened.",
        "Steve Hooks (Detective Partner)": "Good day! I'm Detective Steve Hooks, the investigating officer on this case. How can I assist you with your investigation?",
        "Nels Rasmussen (Father)": "Hello. I'm Nels Rasmussen, the father involved in this case. I'm ready to discuss the details with you."
    };

    Object.keys(characterNames).forEach(character => {
        if (chats[character].messages.length === 0) {
            chats[character].messages.push({
                sender: 'bot',
                message: welcomeMessages[character]
            });
        }
    });
}

// Function to display all user messages (for debugging/tracking)
function displayAllUserMessages() {
    console.log('All User Messages:', allUserMessages);
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

// Initialize welcome messages
addWelcomeMessages();

// Make functions available globally for debugging
window.debugMessages = displayAllUserMessages;
window.getMessageCounts = getMessageCountByCharacter;
