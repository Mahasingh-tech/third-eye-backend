// =====================================================
// THIRD EYE v1.0
// Created by: Maha Singh
// =====================================================


// =====================================================
// CHAT STORAGE KEY
// =====================================================

function getChatStorageKey() {

    const userData =
        localStorage.getItem("thirdEyeUser");

    if (!userData) {
        return "thirdEyeChat_guest";
    }

    try {

        const user =
            JSON.parse(userData);

        if (user && user.id) {
            return "thirdEyeChat_" + user.id;
        }

        return "thirdEyeChat_guest";

    }

    catch (error) {
        return "thirdEyeChat_guest";
    }

}


// =====================================================
// HISTORY STORAGE KEY
// =====================================================

function getHistoryStorageKey() {

    const chatKey =
        getChatStorageKey();

    return chatKey.replace(
        "thirdEyeChat_",
        "thirdEyeHistory_"
    );

}


// =====================================================
// HISTORY CLEARED FLAG
// =====================================================

function getHistoryClearedKey() {

    return getHistoryStorageKey() + "_cleared";

}


// =====================================================
// GLOBAL VARIABLES
// =====================================================

let userName = "";

let chatHistory =
    JSON.parse(
        localStorage.getItem(
            getChatStorageKey()
        )
    ) || [];

let selectedAttachments = [];

let thinkingInterval = null;


// =====================================================
// PROCESSING LOCK
// =====================================================

let isProcessing = false;


function setProcessingState(processing) {

    isProcessing = processing;

    const sendButton =
        document.getElementById("sendBtn");

    if (sendButton) {

        sendButton.disabled =
            processing;

        sendButton.style.opacity =
            processing ? "0.5" : "1";

        sendButton.style.cursor =
            processing
                ? "not-allowed"
                : "pointer";

    }

}


function finishProcessing() {

    setProcessingState(false);

}


// =====================================================
// ANSWER NOTIFICATIONS
// =====================================================

async function requestNotificationPermission() {

    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "default") {

        try {

            await Notification.requestPermission();

        }

        catch (error) {

            console.log(
                "Notification permission error:",
                error
            );

        }

    }

}


function notifyThirdEyeAnswered() {

    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    if (!document.hidden) {
        return;
    }

    const notification =
        new Notification(
            "Third Eye has answered",
            {
                body:
                    "Your answer is ready. 🔔",
                icon:
                    "images/s2.jpeg"
            }
        );

    notification.onclick =
        function () {

            window.focus();

            notification.close();

        };

}


// =====================================================
// THINKING MESSAGES
// =====================================================

const textThinkingMessages = [

    "🤔 Thinking...",
    "🧠 Processing your question...",
    "🔍 Finding the best answer...",
    "✨ Preparing your answer...",
    "🤖 Almost there..."

];


const imageThinkingMessages = [

    "👁️ Analyzing image...",
    "🔍 Examining visual details...",
    "🧠 Understanding the image...",
    "🔎 Looking at the important details...",
    "✨ Putting everything together...",
    "🤖 Preparing the answer...",
    "👁️ Almost there..."

];


const fileThinkingMessages = [

    "📄 Reading file...",
    "🔍 Examining the document...",
    "🧠 Understanding the contents...",
    "✨ Preparing the answer...",
    "🤖 Almost there..."

];


// =====================================================
// AUTH SERVER
// =====================================================

const AUTH_SERVER =
    "https://third-eye-backend-c84c.onrender.com";


// =====================================================
// ADD MESSAGE
// =====================================================

function addMessage(type, text) {

    const chatBox =
        document.getElementById("chat-box");

    if (!chatBox) {
        return null;
    }

    const wrapper =
        document.createElement("div");

    wrapper.style.marginTop =
        "10px";

    const label =
        document.createElement("small");

    if (type === "user") {

        label.innerHTML =
            "<b>👤 You</b>";

    }

    else {

        label.innerHTML =
            "<b>🤖 Third Eye</b>";

    }

    const bubble =
        document.createElement("div");

    bubble.className =
        "message " + type;

    bubble.innerHTML =
        text;

    wrapper.appendChild(label);

    wrapper.appendChild(bubble);

    chatBox.appendChild(wrapper);

    chatBox.scrollTop =
        chatBox.scrollHeight;

    return bubble;

}


// =====================================================
// SHOW THINKING
// =====================================================

function showTyping(type = "text") {

    const chatBox =
        document.getElementById("chat-box");

    if (!chatBox) {
        return;
    }

    if (
        document.getElementById("typing")
    ) {
        return;
    }

    let messages;

    if (type === "image") {
        messages = imageThinkingMessages;
    }

    else if (type === "file") {
        messages = fileThinkingMessages;
    }

    else {
        messages = textThinkingMessages;
    }

    const typing =
        document.createElement("p");

    typing.id =
        "typing";

    typing.innerHTML =
        "<b>🤖 Third Eye:</b> " +
        messages[0];

    chatBox.appendChild(typing);

    chatBox.scrollTop =
        chatBox.scrollHeight;

    let messageIndex = 0;

    thinkingInterval =
        setInterval(
            function () {

                messageIndex++;

                if (
                    messageIndex >=
                    messages.length
                ) {
                    messageIndex = 0;
                }

                const currentTyping =
                    document.getElementById(
                        "typing"
                    );

                if (currentTyping) {

                    currentTyping.innerHTML =
                        "<b>🤖 Third Eye:</b> " +
                        messages[messageIndex];

                    chatBox.scrollTop =
                        chatBox.scrollHeight;

                }

            },
            20000
        );

}


// =====================================================
// REMOVE THINKING
// =====================================================

function removeTyping() {

    const typing =
        document.getElementById("typing");

    if (typing) {
        typing.remove();
    }

    if (thinkingInterval) {

        clearInterval(
            thinkingInterval
        );

        thinkingInterval = null;

    }

}


// =====================================================
// SAVE CHAT
// =====================================================

function saveChat() {

    const chatKey =
        getChatStorageKey();

    const historyKey =
        getHistoryStorageKey();

    const clearedKey =
        getHistoryClearedKey();

    localStorage.setItem(
        chatKey,
        JSON.stringify(chatHistory)
    );

    const historyWasCleared =
        localStorage.getItem(
            clearedKey
        ) === "true";

    if (historyWasCleared) {

        localStorage.removeItem(
            clearedKey
        );

    }

    localStorage.setItem(
        historyKey,
        JSON.stringify(chatHistory)
    );

}


// =====================================================
// MEMORY
// =====================================================

function rememberName(name) {

    userName =
        name;

    localStorage.setItem(
        "thirdeyeName",
        userName
    );

}


function loadName() {

    userName =
        localStorage.getItem(
            "thirdeyeName"
        ) || "";

}


// =====================================================
// SEND MESSAGE
// =====================================================

function sendMessage() {

    if (isProcessing) {
        return;
    }

    const input =
        document.getElementById("message");

    if (!input) {
        return;
    }

    const usermessage =
        input.value.trim();

    if (
        usermessage === "" &&
        selectedAttachments.length === 0
    ) {
        return;
    }

    setProcessingState(true);

    requestNotificationPermission();

    const msg =
        usermessage.toLowerCase();

    let displayedMessage =
        usermessage;


    // =================================================
    // ATTACHMENTS
    // =================================================

    if (
        selectedAttachments.length > 0
    ) {

        const attachmentNames =
            selectedAttachments
                .map(
                    file =>
                        "📎 " +
                        escapeHTML(file.name)
                )
                .join("<br>");

        if (usermessage) {

            displayedMessage =
                attachmentNames +
                "<br>" +
                escapeHTML(usermessage);

        }

        else {

            displayedMessage =
                attachmentNames;

        }

    }

    else {

        displayedMessage =
            escapeHTML(usermessage);

    }


    // =================================================
    // SHOW USER MESSAGE
    // =================================================

    addMessage(
        "user",
        displayedMessage
    );

    chatHistory.push({

        type:
            "user",

        text:
            displayedMessage

    });

    saveChat();

    input.value = "";


    // =================================================
    // FILE ATTACHMENT
    // =================================================

    if (
        selectedAttachments.length > 0
    ) {

        askAIWithFile(
            usermessage
        );

        return;

    }


    // =================================================
    // NAME MEMORY
    // =================================================

    if (
        msg.startsWith("my name is ")
    ) {

        const name =
            usermessage
                .substring(11)
                .trim();

        rememberName(name);

        sendBuiltInReply(
            "Nice to meet you, " +
            escapeHTML(name) +
            "!"
        );

        return;

    }


    if (
        msg === "what is my name" ||
        msg === "what's my name"
    ) {

        if (!userName) {

            sendBuiltInReply(
                "I don't know your name yet."
            );

        }

        else {

            sendBuiltInReply(
                "Your name is " +
                escapeHTML(userName) +
                "."
            );

        }

        return;

    }


    // =================================================
    // GREETINGS
    // =================================================

    if (
        msg === "hello" ||
        msg === "hi" ||
        msg === "hey" ||
        msg === "hello third eye" ||
        msg === "hi third eye"
    ) {

        const greetings = [

            "Hello! 👋",
            "Hi there!",
            "Hey! How are you?",
            "Greetings!",
            "Hello! I'm Third Eye, your AI assistant."

        ];

        const reply =
            greetings[
                Math.floor(
                    Math.random() *
                    greetings.length
                )
            ];

        sendBuiltInReply(reply);

        return;

    }


    // =================================================
    // HOW ARE YOU
    // =================================================

    if (
        msg === "how are you"
    ) {

        sendBuiltInReply(
            "I'm doing great! Thanks for asking. 😊"
        );

        return;

    }


    // =================================================
    // THIRD EYE NAME
    // =================================================

    if (
        msg === "what is your name" ||
        msg === "what's your name"
    ) {

        sendBuiltInReply(
            "My name is Third Eye. 🤖"
        );

        return;

    }


    // =================================================
    // CREATOR
    // =================================================

    if (
        msg === "who made you" ||
        msg === "who created you" ||
        msg === "who is your creator" ||
        msg === "who developed you" ||
        msg === "who made u" ||
        msg === "who created u" ||
        msg === "who developed u"
    ) {

        sendBuiltInReply(
            "I was created by Maha Singh."
        );

        return;

    }


    // =================================================
    // CAPABILITIES
    // =================================================

    if (
        msg === "what can you do"
    ) {

        sendBuiltInReply(

            "I can chat with you, remember your name, " +
            "calculate numbers, tell jokes and facts, " +
            "help with words, use voice input, read " +
            "PDF, TXT and DOCX files, and answer " +
            "questions using my AI model."

        );

        return;

    }


    // =================================================
    // THANK YOU
    // =================================================

    if (
        msg === "thank you" ||
        msg === "thanks"
    ) {

        sendBuiltInReply(
            "You're welcome! 😊"
        );

        return;

    }


    // =================================================
    // GOODBYE
    // =================================================

    if (
        msg === "bye" ||
        msg === "goodbye"
    ) {

        sendBuiltInReply(
            "Goodbye! Have a wonderful day! 👋"
        );

        return;

    }


    // =================================================
    // TIME
    // =================================================

    if (
        msg === "what time is it" ||
        msg === "what is the time"
    ) {

        const now =
            new Date();

        sendBuiltInReply(
            "The time is " +
            now.toLocaleTimeString()
        );

        return;

    }


    // =================================================
    // DATE
    // =================================================

    if (
        msg === "what is today's date" ||
        msg === "what is todays date" ||
        msg === "what date is it"
    ) {

        const today =
            new Date();

        sendBuiltInReply(

            "Today's date is " +

            today.toLocaleDateString(
                "en-US",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            )

        );

        return;

    }


    // =================================================
    // CALCULATOR
    // =================================================

    if (
        /^[0-9+\-*/().%\s]+$/.test(msg) &&
        /[+\-*/%]/.test(msg)
    ) {

        try {

            const answer =
                Function(
                    '"use strict"; return (' +
                    msg +
                    ')'
                )();

            sendBuiltInReply(
                "The answer is " +
                answer
            );

        }

        catch {

            sendBuiltInReply(
                "Sorry, I couldn't calculate that."
            );

        }

        return;

    }


    // =================================================
    // DICE
    // =================================================

    if (
        msg === "roll a dice" ||
        msg === "roll dice"
    ) {

        const dice =
            Math.floor(
                Math.random() * 6
            ) + 1;

        sendBuiltInReply(
            "🎲 You rolled a " +
            dice +
            "!"
        );

        return;

    }


    // =================================================
    // COIN
    // =================================================

    if (
        msg === "flip a coin" ||
        msg === "flip coin"
    ) {

        const coin =
            Math.random() < 0.5
                ? "Heads"
                : "Tails";

        sendBuiltInReply(
            "🪙 " +
            coin +
            "!"
        );

        return;

    }


    // =================================================
    // JOKES
    // =================================================

    if (
        msg === "tell me a joke" ||
        msg === "tell a joke"
    ) {

        const jokes = [

            "Why don't programmers like nature? Because it has too many bugs.",

            "Why did the computer go to the doctor? Because it caught a virus!",

            "Why was the math book sad? Because it had too many problems.",

            "Why did JavaScript break up with HTML? Because it found CSS more attractive.",

            "I told my computer I needed a break. It said: No problem, I'll go to sleep!"

        ];

        sendBuiltInReply(

            jokes[
                Math.floor(
                    Math.random() *
                    jokes.length
                )
            ]

        );

        return;

    }


    // =================================================
    // FACTS
    // =================================================

    if (
        msg === "tell me a fact" ||
        msg === "give me a fact"
    ) {

        const facts = [

            "Honey can remain edible for a very long time because of its low moisture and acidic nature.",

            "An octopus has three hearts.",

            "A giraffe's tongue can be around 45–50 cm long.",

            "The Moon is slowly moving away from Earth.",

            "The human brain contains around 86 billion neurons."

        ];

        sendBuiltInReply(

            "🌍 " +

            facts[
                Math.floor(
                    Math.random() *
                    facts.length
                )
            ]

        );

        return;

    }


    // =================================================
    // RANDOM NUMBER
    // =================================================

    if (
        msg === "random number" ||
        msg === "generate random number"
    ) {

        const number =
            Math.floor(
                Math.random() * 100
            ) + 1;

        sendBuiltInReply(

            "🎲 Your random number is " +
            number +
            "!"

        );

        return;

    }


    // =================================================
    // RANDOM NUMBER BETWEEN
    // =================================================

    if (
        msg.startsWith(
            "random number between "
        ) ||
        msg.startsWith(
            "generate a random number between "
        )
    ) {

        let numbers;

        if (
            msg.startsWith(
                "random number between "
            )
        ) {

            numbers =
                msg.substring(22);

        }

        else {

            numbers =
                msg.substring(34);

        }

        const parts =
            numbers.split("and");

        if (
            parts.length === 2
        ) {

            const min =
                parseInt(
                    parts[0].trim()
                );

            const max =
                parseInt(
                    parts[1].trim()
                );

            if (
                !isNaN(min) &&
                !isNaN(max) &&
                min <= max
            ) {

                const randomNumber =
                    Math.floor(
                        Math.random() *
                        (max - min + 1)
                    ) + min;

                sendBuiltInReply(

                    "🎲 Random number between " +
                    min +
                    " and " +
                    max +
                    ": " +
                    randomNumber

                );

            }

            else {

                sendBuiltInReply(
                    "Please give me a valid range."
                );

            }

        }

        else {

            sendBuiltInReply(
                "Use: random number between 1 and 100"
            );

        }

        return;

    }


    // =================================================
    // CLEAR CHAT
    // =================================================

    if (
        msg === "clear chat"
    ) {

        clearChat();

        return;

    }


    // =================================================
    // ALL OTHER QUESTIONS → AI
    // =================================================
    // IMPORTANT:
    // Definitions, meanings, synonyms, antonyms,
    // examples, pronunciation and word-of-the-day
    // questions are now handled by the AI.
    // =================================================

    askAI(
        usermessage
    );

}


// =====================================================
// BUILT-IN REPLY
// =====================================================

function sendBuiltInReply(reply) {

    showTyping("text");

    setTimeout(
        function () {

            removeTyping();

            addMessage(
                "bot",
                reply
            );

            chatHistory.push({

                type:
                    "bot",

                text:
                    reply

            });

            saveChat();

            notifyThirdEyeAnswered();

            finishProcessing();

        },
        600
    );

}


// =====================================================
// AI
// =====================================================

async function askAI(usermessage) {

    showTyping("text");

    try {

        let attachmentText = "";

        for (
            const file of selectedAttachments
        ) {

            if (
                file.type === "text/plain" ||
                file.name
                    .toLowerCase()
                    .endsWith(".txt")
            ) {

                const text =
                    await file.text();

                attachmentText +=
                    "\n\n===== FILE: " +
                    file.name +
                    " =====\n\n" +
                    text;

            }

        }


        // =================================================
        // AI INSTRUCTION
        // =================================================

        let finalMessage =

            "IMPORTANT: Answer the user's question directly. " +

            "Do NOT greet the user, introduce yourself, say " +
            "'Hey there', say 'I'm your AI assistant', or " +
            "repeat a welcome message unless the user's actual " +
            "message is a greeting. " +

            "Answer definitions, meanings, synonyms, antonyms, " +
            "examples, pronunciation questions, word meanings, " +
            "and word-of-the-day requests normally and accurately. " +

            "If the user asks for pronunciation, provide an easy " +
            "English pronunciation and, when useful, IPA. " +

            "If the user asks for a definition, give a clear " +
            "definition and a simple example when appropriate. " +

            "If the user asks for synonyms or antonyms, provide " +
            "useful examples. " +

            "\n\nUser's question:\n" +
            usermessage;


        if (attachmentText) {

            finalMessage +=
                "\n\n" +
                "The user attached the following file(s). " +
                "Use their contents when answering the user's question:" +
                attachmentText;

        }


        const response =
            await fetch(
                `${AUTH_SERVER}/chat`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                finalMessage

                        })

                }
            );


        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );

        }


        removeTyping();


        const replyBox =
            addMessage(
                "bot",
                ""
            );


        const reader =
            response.body.getReader();


        const decoder =
            new TextDecoder();


        let fullReply = "";


        while (true) {

            const result =
                await reader.read();


            if (result.done) {
                break;
            }


            const text =
                decoder.decode(
                    result.value,
                    {
                        stream: true
                    }
                );


            fullReply +=
                text;


            if (replyBox) {

                replyBox.innerHTML =
                    escapeHTML(
                        fullReply
                    )
                    .replace(
                        /\n/g,
                        "<br>"
                    );

            }

        }


        chatHistory.push({

            type:
                "bot",

            text:
                escapeHTML(
                    fullReply
                )

        });


        saveChat();

        notifyThirdEyeAnswered();


        selectedAttachments = [];

        displayAttachments();

    }


    catch (error) {

        console.error(
            "AI server error:",
            error
        );


        removeTyping();


        addMessage(
            "bot",
            "❌ I couldn't connect to the Third Eye AI server. Please try again."
        );

    }


    finally {

        finishProcessing();

    }

}


// =====================================================
// AI WITH FILE
// =====================================================

async function askAIWithFile(usermessage) {

    if (
        selectedAttachments.length === 0
    ) {

        finishProcessing();

        return;

    }


    const file =
        selectedAttachments[0];


    const lowerName =
        file.name.toLowerCase();


    const fileType =
        file.type || "";


    const isImage =
        fileType.startsWith("image/") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".webp");


    if (isImage) {
        showTyping("image");
    }

    else {
        showTyping("file");
    }


    try {

        const allowedTypes = [

            ".pdf",
            ".txt",
            ".docx",
            ".jpeg",
            ".jpg",
            ".png",
            ".webp"

        ];


        const supportedByExtension =
            allowedTypes.some(
                function (extension) {

                    return lowerName.endsWith(
                        extension
                    );

                }
            );


        const supportedByMime =
            fileType === "application/pdf" ||
            fileType === "text/plain" ||
            fileType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            fileType.startsWith("image/");


        const supported =
            supportedByExtension ||
            supportedByMime;


        if (!supported) {

            removeTyping();

            addMessage(
                "bot",
                "❌ This file type isn't supported yet. Please attach a PDF, TXT, DOCX, JPEG, JPG, PNG or WEBP file."
            );

            selectedAttachments = [];

            displayAttachments();

            finishProcessing();

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "file",
            file
        );


        formData.append(
            "message",
            usermessage ||
            "Please summarize this document."
        );


        const response =
            await fetch(
                `${AUTH_SERVER}/chat-with-file`,
                {

                    method:
                        "POST",

                    body:
                        formData

                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();

            throw new Error(
                errorText ||
                "File processing failed."
            );

        }


        removeTyping();


        const replyBox =
            addMessage(
                "bot",
                ""
            );


        const reader =
            response.body.getReader();


        const decoder =
            new TextDecoder();


        let fullReply = "";


        while (true) {

            const result =
                await reader.read();


            if (result.done) {
                break;
            }


            const text =
                decoder.decode(
                    result.value,
                    {
                        stream: true
                    }
                );


            fullReply +=
                text;


            if (replyBox) {

                replyBox.innerHTML =
                    escapeHTML(
                        fullReply
                    )
                    .replace(
                        /\n/g,
                        "<br>"
                    );

            }

        }


        chatHistory.push({

            type:
                "bot",

            text:
                escapeHTML(
                    fullReply
                )

        });


        saveChat();

        notifyThirdEyeAnswered();


        selectedAttachments = [];

        displayAttachments();

    }


    catch (error) {

        console.error(
            "File AI error:",
            error
        );


        removeTyping();


        addMessage(
            "bot",

            "❌ I couldn't read that file. " +
            escapeHTML(
                error.message ||
                "Please try again."
            )

        );

    }


    finally {

        finishProcessing();

    }

}


// =====================================================
// CLEAR CHAT
// =====================================================

function clearChat() {

    const chatBox =
        document.getElementById(
            "chat-box"
        );


    if (chatBox) {

        chatBox.innerHTML =
            "";

    }


    chatHistory = [];


    localStorage.setItem(

        getChatStorageKey(),

        JSON.stringify([])

    );


    selectedAttachments = [];

    displayAttachments();

    removeTyping();

    finishProcessing();

}


// =====================================================
// CLEAR HISTORY
// =====================================================

function clearHistory() {

    const confirmDelete =
        confirm(
            "Are you sure you want to permanently delete all chat history?"
        );


    if (!confirmDelete) {
        return;
    }


    const historyKey =
        getHistoryStorageKey();


    const clearedKey =
        getHistoryClearedKey();


    localStorage.setItem(
        historyKey,
        JSON.stringify([])
    );


    localStorage.setItem(
        clearedKey,
        "true"
    );


    const overlay =
        document.getElementById(
            "history-overlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }


    alert(
        "Chat history has been cleared. 🧹"
    );

}


// =====================================================
// HISTORY
// =====================================================

function showHistory() {

    const historyKey =
        getHistoryStorageKey();


    const historyStored =
        localStorage.getItem(
            historyKey
        );


    let history =
        historyStored
            ? JSON.parse(historyStored)
            : [];


    // =================================================
    // OLD STORAGE MIGRATION
    // =================================================

    if (
        historyStored === null
    ) {

        const oldChat =
            JSON.parse(
                localStorage.getItem(
                    getChatStorageKey()
                )
            ) || [];


        if (
            oldChat.length > 0
        ) {

            history =
                oldChat;


            localStorage.setItem(

                historyKey,

                JSON.stringify(
                    history
                )

            );

        }

    }


    const overlay =
        document.getElementById(
            "history-overlay"
        );


    const content =
        document.getElementById(
            "history-content"
        );


    if (
        !overlay ||
        !content
    ) {

        return;

    }


    content.innerHTML =
        "";


    if (
        history.length === 0
    ) {

        content.innerHTML = `

            <div class="history-empty">

                <div class="history-empty-icon">
                    📜
                </div>

                <h3>
                    No conversations yet
                </h3>

                <p>
                    Start chatting with Third Eye
                    to see your conversations here.
                </p>

            </div>

        `;


        overlay.classList.add(
            "show"
        );


        return;

    }


    history.forEach(
        chat => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "history-item-title";


            const preview =
                document.createElement(
                    "div"
                );


            preview.className =
                "history-item-preview";


            const cleanText =
                stripHTML(
                    chat.text || ""
                );


            if (
                chat.type === "user"
            ) {

                title.textContent =
                    "👤 " +
                    cleanText;


                preview.textContent =
                    "Your message";

            }

            else {

                title.textContent =
                    "🤖 Third Eye";


                preview.textContent =
                    cleanText;

            }


            item.appendChild(
                title
            );


            item.appendChild(
                preview
            );


            content.appendChild(
                item
            );

        }
    );


    overlay.classList.add(
        "show"
    );

}


function closeHistory() {

    const overlay =
        document.getElementById(
            "history-overlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}


// =====================================================
// LOAD CHAT HISTORY
// =====================================================

function loadChatHistory() {

    const chatBox =
        document.getElementById(
            "chat-box"
        );


    if (!chatBox) {
        return;
    }


    chatBox.innerHTML =
        "";


    chatHistory =
        JSON.parse(
            localStorage.getItem(
                getChatStorageKey()
            )
        ) || [];


    chatHistory.forEach(
        chat => {

            addMessage(
                chat.type,
                chat.text
            );

        }
    );

}


// =====================================================
// DARK MODE
// =====================================================

function toggleDarkMode() {

    document.body.classList.toggle(
        "dark-mode"
    );


    localStorage.setItem(

        "thirdeyeDarkMode",

        document.body.classList.contains(
            "dark-mode"
        )
            ? "on"
            : "off"

    );

}


function loadDarkMode() {

    if (
        localStorage.getItem(
            "thirdeyeDarkMode"
        ) === "on"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }

}


// =====================================================
// ENTER KEY
// =====================================================

function checkEnter(event) {

    if (
        event.key === "Enter"
    ) {

        event.preventDefault();


        if (isProcessing) {
            return;
        }


        sendMessage();

    }

}


// =====================================================
// VOICE INPUT
// =====================================================

function startListening() {

    if (
        !("webkitSpeechRecognition" in window)
    ) {

        alert(
            "Speech Recognition is not supported in this browser."
        );

        return;

    }


    if (isProcessing) {
        return;
    }


    const recognition =
        new webkitSpeechRecognition();


    recognition.lang =
        "en-US";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        function () {

            const button =
                document.getElementById(
                    "micBtn"
                );


            if (button) {

                button.innerHTML =
                    "🎙️";

            }

        };


    recognition.onresult =
        function (event) {

            let speech =
                event.results[0][0]
                    .transcript;


            speech =
                speech
                    .replace(
                        /[.,!?;:]/g,
                        ""
                    )
                    .trim();


            const input =
                document.getElementById(
                    "message"
                );


            if (input) {

                input.value =
                    speech;

            }


            sendMessage();

        };


    recognition.onerror =
        function (event) {

            console.log(
                "Speech recognition error:",
                event.error
            );

        };


    recognition.onend =
        function () {

            const button =
                document.getElementById(
                    "micBtn"
                );


            if (button) {

                button.innerHTML =
                    "🎤";

            }

        };


    recognition.start();

}


// =====================================================
// SPEAK TEXT
// =====================================================

function speakText(text) {

    if (
        "speechSynthesis" in window
    ) {

        const speech =
            new SpeechSynthesisUtterance(
                stripHTML(text)
            );


        speech.lang =
            "en-US";


        window.speechSynthesis.speak(
            speech
        );

    }

}


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(text);


    return div.innerHTML;

}


function stripHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.innerHTML =
        text;


    return div.textContent ||
        div.innerText ||
        "";

}


// =====================================================
// WELCOME SCREEN
// =====================================================

function startThirdEye() {

    const welcomeScreen =
        document.getElementById(
            "welcome-screen"
        );


    const chatContainer =
        document.querySelector(
            ".chat-container"
        );


    if (
        !welcomeScreen ||
        !chatContainer
    ) {

        return;

    }


    welcomeScreen.style.pointerEvents =
        "none";


    welcomeScreen.classList.add(
        "welcome-hidden"
    );


    chatContainer.classList.add(
        "chat-visible"
    );


    setTimeout(
        function () {

            welcomeScreen.style.display =
                "none";

        },
        700
    );

}


// =====================================================
// ATTACHMENT MENU
// =====================================================

function toggleAttachmentMenu() {

    const menu =
        document.getElementById(
            "attachment-menu"
        );


    if (!menu) {
        return;
    }


    menu.classList.toggle(
        "show"
    );

}


function selectImages() {

    if (isProcessing) {
        return;
    }


    const input =
        document.getElementById(
            "imageInput"
        );


    if (input) {
        input.click();
    }


    closeAttachmentMenu();

}


function selectFiles() {

    if (isProcessing) {
        return;
    }


    const input =
        document.getElementById(
            "fileInput"
        );


    if (input) {
        input.click();
    }


    closeAttachmentMenu();

}


function closeAttachmentMenu() {

    const menu =
        document.getElementById(
            "attachment-menu"
        );


    if (menu) {

        menu.classList.remove(
            "show"
        );

    }

}


// =====================================================
// HANDLE IMAGES
// =====================================================

function handleImages(event) {

    if (isProcessing) {

        event.target.value =
            "";

        return;

    }


    const files =
        Array.from(
            event.target.files
        );


    addAttachments(files);


    event.target.value =
        "";

}


// =====================================================
// HANDLE FILES
// =====================================================

function handleFiles(event) {

    if (isProcessing) {

        event.target.value =
            "";

        return;

    }


    const files =
        Array.from(
            event.target.files
        );


    addAttachments(files);


    event.target.value =
        "";

}


// =====================================================
// ADD ATTACHMENTS
// =====================================================

function addAttachments(files) {

    if (isProcessing) {
        return;
    }


    files.forEach(
        file => {

            selectedAttachments.push(
                file
            );

        }
    );


    displayAttachments();

}


// =====================================================
// DISPLAY ATTACHMENTS
// =====================================================

function displayAttachments() {

    const preview =
        document.getElementById(
            "attachment-preview"
        );


    if (!preview) {
        return;
    }


    preview.innerHTML =
        "";


    selectedAttachments.forEach(
        function (file, index) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "attachment-item";


            let icon =
                "📎";


            if (
                file.type.startsWith(
                    "image/"
                )
            ) {

                icon =
                    "🖼️";

            }


            item.innerHTML = `

                <span>${icon}</span>

                <span
                    class="attachment-name"
                    title="${escapeHTML(file.name)}"
                >
                    ${escapeHTML(file.name)}
                </span>

                <button
                    class="attachment-remove"
                    onclick="removeAttachment(${index})"
                >
                    ×
                </button>

            `;


            preview.appendChild(
                item
            );

        }
    );

}


// =====================================================
// REMOVE ATTACHMENT
// =====================================================

function removeAttachment(index) {

    if (isProcessing) {
        return;
    }


    selectedAttachments.splice(
        index,
        1
    );


    displayAttachments();

}


// =====================================================
// GET ATTACHMENTS
// =====================================================

function getSelectedAttachments() {

    return selectedAttachments;

}


// =====================================================
// CLOSE ATTACHMENT MENU OUTSIDE
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        const wrapper =
            document.getElementById(
                "attachment-wrapper"
            );


        const menu =
            document.getElementById(
                "attachment-menu"
            );


        if (
            wrapper &&
            menu &&
            !wrapper.contains(
                event.target
            )
        ) {

            menu.classList.remove(
                "show"
            );

        }

    }
);


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

    const loginBox =
        document.getElementById(
            "login-box"
        );


    const signupBox =
        document.getElementById(
            "signup-box"
        );


    if (loginBox) {
        loginBox.style.display = "block";
    }


    if (signupBox) {
        signupBox.style.display = "none";
    }


    const loginMessage =
        document.getElementById(
            "login-message"
        );


    const signupMessage =
        document.getElementById(
            "signup-message"
        );


    if (loginMessage) {
        loginMessage.textContent = "";
    }


    if (signupMessage) {
        signupMessage.textContent = "";
    }

}


// =====================================================
// SHOW SIGN UP
// =====================================================

function showSignup() {

    const loginBox =
        document.getElementById(
            "login-box"
        );


    const signupBox =
        document.getElementById(
            "signup-box"
        );


    if (loginBox) {
        loginBox.style.display = "none";
    }


    if (signupBox) {
        signupBox.style.display = "block";
    }


    const loginMessage =
        document.getElementById(
            "login-message"
        );


    const signupMessage =
        document.getElementById(
            "signup-message"
        );


    if (loginMessage) {
        loginMessage.textContent = "";
    }


    if (signupMessage) {
        signupMessage.textContent = "";
    }

}


// =====================================================
// SIGN UP
// =====================================================

async function signupUser() {

    const nameInput =
        document.getElementById(
            "signup-name"
        );


    const emailInput =
        document.getElementById(
            "signup-email"
        );


    const passwordInput =
        document.getElementById(
            "signup-password"
        );


    const message =
        document.getElementById(
            "signup-message"
        );


    if (
        !nameInput ||
        !emailInput ||
        !passwordInput ||
        !message
    ) {
        return;
    }


    const name =
        nameInput.value.trim();


    const email =
        emailInput.value.trim();


    const password =
        passwordInput.value;


    if (
        !name ||
        !email ||
        !password
    ) {

        message.textContent =
            "Please fill in all fields.";

        return;

    }


    if (
        password.length < 6
    ) {

        message.textContent =
            "Password must be at least 6 characters.";

        return;

    }


    message.textContent =
        "Creating your account...";


    try {

        const response =
            await fetch(
                `${AUTH_SERVER}/signup`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name:
                                name,

                            email:
                                email,

                            password:
                                password

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.message ||
                "Could not create account.";

            return;

        }


        localStorage.setItem(
            "thirdEyeToken",
            data.token
        );


        localStorage.setItem(
            "thirdEyeUser",
            JSON.stringify(
                data.user
            )
        );


        message.textContent =
            "Account created!";


        setTimeout(
            function () {

                enterThirdEye();

            },
            500
        );

    }


    catch (error) {

        console.error(
            "Signup error:",
            error
        );


        message.textContent =
            "Cannot connect to Third Eye server.";

    }

}


// =====================================================
// LOGIN
// =====================================================

async function loginUser() {

    const emailInput =
        document.getElementById(
            "login-email"
        );


    const passwordInput =
        document.getElementById(
            "login-password"
        );


    const message =
        document.getElementById(
            "login-message"
        );


    if (
        !emailInput ||
        !passwordInput ||
        !message
    ) {

        console.error(
            "Login elements not found."
        );

        return;

    }


    const email =
        emailInput.value.trim();


    const password =
        passwordInput.value;


    if (
        !email ||
        !password
    ) {

        message.textContent =
            "Please enter your email and password.";

        return;

    }


    message.textContent =
        "Logging in...";


    try {

        console.log(
            "Connecting to:",
            `${AUTH_SERVER}/login`
        );


        const response =
            await fetch(
                `${AUTH_SERVER}/login`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            email:
                                email,

                            password:
                                password

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            message.textContent =
                data.message ||
                "Invalid email or password.";

            return;

        }


        localStorage.setItem(
            "thirdEyeToken",
            data.token
        );


        localStorage.setItem(
            "thirdEyeUser",
            JSON.stringify(
                data.user
            )
        );


        chatHistory =
            JSON.parse(
                localStorage.getItem(
                    getChatStorageKey()
                )
            ) || [];


        message.textContent =
            "Login successful!";


        setTimeout(
            function () {

                enterThirdEye();

            },
            500
        );

    }


    catch (error) {

        console.error(
            "Login error:",
            error
        );


        message.textContent =
            "Cannot connect to Third Eye server. Make sure the server is running.";

    }

}


// =====================================================
// ENTER THIRD EYE
// =====================================================

function enterThirdEye() {

    const authScreen =
        document.getElementById(
            "auth-screen"
        );


    const welcomeScreen =
        document.getElementById(
            "welcome-screen"
        );


    if (authScreen) {

        authScreen.style.display =
            "none";

    }


    if (welcomeScreen) {

        welcomeScreen.style.display =
            "flex";

    }


    const userData =
        localStorage.getItem(
            "thirdEyeUser"
        );


    if (userData) {

        try {

            const user =
                JSON.parse(
                    userData
                );


            if (user) {

                console.log(
                    "Welcome to Third Eye, " +
                    (user.name || "User")
                );

            }

        }

        catch (error) {

            console.error(
                "Could not read user data:",
                error
            );

        }

    }

}


// =====================================================
// CHECK LOGIN
// =====================================================

function checkThirdEyeLogin() {

    const token =
        localStorage.getItem(
            "thirdEyeToken"
        );


    const authScreen =
        document.getElementById(
            "auth-screen"
        );


    const welcomeScreen =
        document.getElementById(
            "welcome-screen"
        );


    if (token) {

        if (authScreen) {

            authScreen.style.display =
                "none";

        }


        if (welcomeScreen) {

            welcomeScreen.style.display =
                "flex";

        }

    }

    else {

        if (authScreen) {

            authScreen.style.display =
                "flex";

        }


        if (welcomeScreen) {

            welcomeScreen.style.display =
                "none";

        }

    }

}


// =====================================================
// LOGOUT
// =====================================================

function logoutThirdEye() {

    const confirmed =
        confirm(
            "Are you sure you want to log out?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem(
        "thirdEyeToken"
    );


    localStorage.removeItem(
        "thirdEyeUser"
    );


    location.reload();

}


// =====================================================
// PROFILE MENU
// =====================================================

function toggleProfileMenu() {

    const menu =
        document.getElementById(
            "profile-menu"
        );


    if (!menu) {
        return;
    }


    menu.classList.toggle(
        "show"
    );


    updateProfileInfo();

}


// =====================================================
// PROFILE INFORMATION
// =====================================================

function updateProfileInfo() {

    const userData =
        localStorage.getItem(
            "thirdEyeUser"
        );


    if (!userData) {
        return;
    }


    try {

        const user =
            JSON.parse(
                userData
            );


        const name =
            document.getElementById(
                "profile-name"
            );


        const email =
            document.getElementById(
                "profile-email"
            );


        if (name) {

            name.textContent =
                user.name ||
                "User";

        }


        if (email) {

            email.textContent =
                user.email ||
                "";

        }

    }

    catch (error) {

        console.error(
            "Could not load profile:",
            error
        );

    }

}


// =====================================================
// CLOSE PROFILE MENU OUTSIDE
// =====================================================

document.addEventListener(
    "click",
    function (event) {

        const wrapper =
            document.getElementById(
                "profile-wrapper"
            );


        const menu =
            document.getElementById(
                "profile-menu"
            );


        if (
            wrapper &&
            menu &&
            !wrapper.contains(
                event.target
            )
        ) {

            menu.classList.remove(
                "show"
            );

        }

    }
);


// =====================================================
// HELP
// =====================================================

function showHelp() {

    const helpPopup =
        document.createElement("div");


    helpPopup.id =
        "help-popup";


    helpPopup.innerHTML = `
        <div class="help-box">

            <button
                type="button"
                class="help-close"
                onclick="document.getElementById('help-popup').remove()">
                ×
            </button>

            <h2>❓ Third Eye Help</h2>

            <p>💬 <strong>Chat:</strong> Ask Third Eye anything.</p>

            <p>🎤 <strong>Voice:</strong> Use the microphone to speak.</p>

            <p>📎 <strong>Files:</strong> Attach files or images.</p>

            <p>🌙 <strong>Dark Mode:</strong> Change the appearance.</p>

            <p>📜 <strong>History:</strong> View previous conversations.</p>

            <p>🧹 <strong>Clear Chat:</strong> Clear the current chat.</p>

        </div>
    `;


    document.body.appendChild(
        helpPopup
    );

}


// =====================================================
// STARTUP
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Third Eye script loaded."
        );


        // =============================================
        // LOGIN CHECK
        // =============================================

        checkThirdEyeLogin();


        // =============================================
        // NAME
        // =============================================

        loadName();


        // =============================================
        // DARK MODE
        // =============================================

        loadDarkMode();


        // =============================================
        // SEND BUTTON INITIAL STATE
        // =============================================

        setProcessingState(false);


        // =============================================
        // LOGIN BUTTON
        // =============================================

        const loginButton =
            document.getElementById(
                "login-button"
            );


        if (loginButton) {

            loginButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    loginUser();

                }
            );


            console.log(
                "Login button connected successfully."
            );

        }

        else {

            console.warn(
                "Login button was not found."
            );

        }


        // =============================================
        // CHAT BOX
        // =============================================

        const chatBox =
            document.getElementById(
                "chat-box"
            );


        if (chatBox) {

            chatBox.innerHTML =
                "";

        }

    }
);
