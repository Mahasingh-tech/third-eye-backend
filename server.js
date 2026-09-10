const express = require("express");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");
const { pdf } = require("pdf-to-img");
const path = require("path");

const app = express();


/* =====================================================
   CHATBOT LOCATION
   ===================================================== */

const chatbotFolder = path.join(__dirname);
const chatbotFile = path.join(
    chatbotFolder,
    "sukoga.html"
);


/* =====================================================
   MIDDLEWARE
   ===================================================== */

app.use(cors());
app.use(express.json());


/* =====================================================
   BACKEND ROOT
   ===================================================== */

app.get("/", function (req, res) {
    res.send(
        "Third Eye backend is running successfully! 🚀"
    );
});


/* =====================================================
   CHATBOT
   ===================================================== */

app.get("/chatbot", function (req, res) {

    res.sendFile(
        chatbotFile,
        function (error) {

            if (error) {

                console.error(
                    "Chatbot file error:",
                    error
                );

                if (!res.headersSent) {

                    res.status(500).send(
                        "Could not open Third Eye chatbot."
                    );

                }

            }

        }
    );

});


/* =====================================================
   SERVE CHATBOT FILES
   ===================================================== */

app.use(
    "/chatbot",
    express.static(chatbotFolder)
);


/* =====================================================
   SERVER SETTINGS
   ===================================================== */

const PORT =
    process.env.PORT || 3000;


/* =====================================================
   GEMINI SETTINGS
   ===================================================== */

const GEMINI_API_KEY =
    process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
    "gemini-3.5-flash-lite";


/* =====================================================
   USERS FILE
   ===================================================== */

const USERS_FILE =
    path.join(
        __dirname,
        "users.json"
    );


/* =====================================================
   FILE UPLOAD CONFIGURATION
   ===================================================== */

const upload = multer({

    storage:
        multer.memoryStorage(),

    limits: {

        fileSize:
            20 * 1024 * 1024

    }

});


/* =====================================================
   CREATE USERS FILE
   ===================================================== */

if (
    !fs.existsSync(
        USERS_FILE
    )
) {

    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(
            [],
            null,
            2
        )
    );

}


/* =====================================================
   GET USERS
   ===================================================== */

function getUsers() {

    try {

        return JSON.parse(
            fs.readFileSync(
                USERS_FILE,
                "utf8"
            )
        );

    }

    catch (error) {

        console.error(
            "Could not read users file:",
            error
        );

        return [];

    }

}


/* =====================================================
   SAVE USERS
   ===================================================== */

function saveUsers(users) {

    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(
            users,
            null,
            2
        )
    );

}


/* =====================================================
   PASSWORD HASHING
   ===================================================== */

function hashPassword(password) {

    const salt =
        crypto
            .randomBytes(16)
            .toString("hex");

    const hash =
        crypto
            .scryptSync(
                password,
                salt,
                64
            )
            .toString("hex");

    return salt + ":" + hash;

}


/* =====================================================
   CHECK PASSWORD
   ===================================================== */

function checkPassword(
    password,
    storedPassword
) {

    if (
        typeof storedPassword !== "string"
    ) {

        return false;

    }


    const parts =
        storedPassword.split(":");


    if (
        parts.length !== 2
    ) {

        return false;

    }


    const salt =
        parts[0];

    const originalHash =
        parts[1];


    const hash =
        crypto
            .scryptSync(
                password,
                salt,
                64
            )
            .toString("hex");


    try {

        const currentBuffer =
            Buffer.from(
                hash,
                "hex"
            );

        const originalBuffer =
            Buffer.from(
                originalHash,
                "hex"
            );


        if (
            currentBuffer.length !==
            originalBuffer.length
        ) {

            return false;

        }


        return crypto.timingSafeEqual(
            currentBuffer,
            originalBuffer
        );

    }

    catch (error) {

        return false;

    }

}


/* =====================================================
   TOKEN
   ===================================================== */

const TOKEN_SECRET =
    process.env.TOKEN_SECRET ||
    "third-eye-local-development-secret";


/* =====================================================
   CREATE TOKEN
   ===================================================== */

function createToken(user) {

    const payload = {

        id:
            user.id,

        email:
            user.email,

        name:
            user.name

    };


    const data =
        Buffer
            .from(
                JSON.stringify(
                    payload
                )
            )
            .toString(
                "base64url"
            );


    const signature =
        crypto
            .createHmac(
                "sha256",
                TOKEN_SECRET
            )
            .update(data)
            .digest(
                "base64url"
            );


    return data + "." + signature;

}


/* =====================================================
   SIGN UP
   ===================================================== */

app.post(
    "/signup",
    function (req, res) {

        try {

            const name =
                req.body.name;

            const email =
                req.body.email;

            const password =
                req.body.password;


            if (
                !name ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Please fill in all fields."

                });

            }


            if (
                password.length < 6
            ) {

                return res.status(400).json({

                    message:
                        "Password must be at least 6 characters."

                });

            }


            const users =
                getUsers();


            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            const existingUser =
                users.find(
                    function (user) {

                        return (
                            user.email ===
                            cleanEmail
                        );

                    }
                );


            if (
                existingUser
            ) {

                return res.status(409).json({

                    message:
                        "An account with this email already exists."

                });

            }


            const newUser = {

                id:
                    crypto.randomUUID(),

                name:
                    name.trim(),

                email:
                    cleanEmail,

                password:
                    hashPassword(
                        password
                    ),

                createdAt:
                    new Date()
                        .toISOString()

            };


            users.push(
                newUser
            );


            saveUsers(
                users
            );


            const token =
                createToken(
                    newUser
                );


            res.status(201).json({

                message:
                    "Account created successfully.",

                token:
                    token,

                user: {

                    id:
                        newUser.id,

                    name:
                        newUser.name,

                    email:
                        newUser.email

                }

            });

        }

        catch (error) {

            console.error(
                "Signup error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not create account."

            });

        }

    }
);


/* =====================================================
   LOGIN
   ===================================================== */

app.post(
    "/login",
    function (req, res) {

        try {

            const email =
                req.body.email;

            const password =
                req.body.password;


            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    message:
                        "Please enter your email and password."

                });

            }


            const users =
                getUsers();


            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            const user =
                users.find(
                    function (item) {

                        return (
                            item.email ===
                            cleanEmail
                        );

                    }
                );


            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid email or password."

                });

            }


            const passwordCorrect =
                checkPassword(
                    password,
                    user.password
                );


            if (
                !passwordCorrect
            ) {

                return res.status(401).json({

                    message:
                        "Invalid email or password."

                });

            }


            const token =
                createToken(
                    user
                );


            res.json({

                message:
                    "Login successful.",

                token:
                    token,

                user: {

                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email

                }

            });

        }

        catch (error) {

            console.error(
                "Login error:",
                error
            );


            res.status(500).json({

                message:
                    "Login failed."

            });

        }

    }
);


/* =====================================================
   GEMINI API
   ===================================================== */

async function callGemini(contents) {

    if (
        !GEMINI_API_KEY
    ) {

        throw new Error(
            "GEMINI_API_KEY is missing from Render Environment Variables."
        );

    }


    const geminiURL =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        GEMINI_MODEL +
        ":generateContent";


    /*
     * Gemini can temporarily return 503 when the model
     * is under heavy demand.
     *
     * We retry the request up to 4 times.
     */

    const maxAttempts = 4;


    for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
    ) {

        try {

            console.log(
                "Gemini request attempt " +
                attempt +
                "/" +
                maxAttempts
            );


            const response =
                await fetch(
                    geminiURL,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "x-goog-api-key":
                                GEMINI_API_KEY

                        },

                        body:
                            JSON.stringify({

                                contents:
                                    contents,

                                generationConfig: {

                                    temperature:
                                        0.7,

                                    maxOutputTokens:
                                        4096

                                }

                            })

                    }
                );


            const responseText =
                await response.text();


            /* =================================================
               TEMPORARY 503 RETRY
               ================================================= */

            if (
                response.status === 503 &&
                attempt < maxAttempts
            ) {

                const waitTime =
                    Math.pow(
                        2,
                        attempt
                    ) * 2000;


                console.warn(
                    "Gemini returned 503. " +
                    "Retrying in " +
                    (waitTime / 1000) +
                    " seconds..."
                );


                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            waitTime
                        );

                    }
                );


                continue;

            }


            /* =================================================
               OTHER GEMINI ERRORS
               ================================================= */

            if (
                !response.ok
            ) {

                console.error(
                    "Gemini API error:",
                    response.status,
                    responseText
                );


                throw new Error(
                    "Gemini API returned status " +
                    response.status +
                    ": " +
                    responseText
                );

            }


            /* =================================================
               PARSE GEMINI RESPONSE
               ================================================= */

            let data;


            try {

                data =
                    JSON.parse(
                        responseText
                    );

            }

            catch (error) {

                throw new Error(
                    "Gemini returned invalid JSON."
                );

            }


            /* =================================================
               READ GEMINI RESPONSE
               ================================================= */

            let parts = null;


            if (
                data &&
                data.candidates &&
                Array.isArray(data.candidates) &&
                data.candidates.length > 0 &&
                data.candidates[0] &&
                data.candidates[0].content &&
                Array.isArray(
                    data.candidates[0].content.parts
                )
            ) {

                parts =
                    data.candidates[0].content.parts;

            }


            if (
                !Array.isArray(parts)
            ) {

                console.error(
                    "Unexpected Gemini response:",
                    JSON.stringify(data)
                );


                throw new Error(
                    "Gemini returned no answer."
                );

            }


            let text = "";


            parts.forEach(
                function (part) {

                    if (
                        part &&
                        typeof part.text === "string"
                    ) {

                        text += part.text;

                    }

                }
            );


            if (
                !text.trim()
            ) {

                throw new Error(
                    "Gemini returned an empty answer."
                );

            }


            return text;

        }

        catch (error) {

            /*
             * Retry temporary/network failures.
             * If this is the final attempt, stop retrying.
             */

            if (
                attempt >= maxAttempts
            ) {

                console.error(
                    "Gemini failed after " +
                    maxAttempts +
                    " attempts:",
                    error
                );


                throw error;

            }


            console.warn(
                "Gemini request failed on attempt " +
                attempt +
                ":",
                error.message
            );


            const waitTime =
                Math.pow(
                    2,
                    attempt
                ) * 2000;


            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        waitTime
                    );

                }
            );

        }

    }

}


/* =====================================================
   NORMAL TEXT CHAT
   ===================================================== */

async function askGeminiText(
    userMessage
) {

    const prompt =
        "You are Third Eye, a helpful AI assistant.\n\n" +

        "Answer questions clearly and accurately.\n\n" +

        "Be friendly and natural.\n\n" +

        "For simple questions, give concise answers.\n\n" +

        "For educational questions, explain things " +
        "in an easy-to-understand way.\n\n" +

        "Do not mention that you are connected to an API.\n\n" +

        "User question:\n\n" +

        userMessage;


    const contents = [

        {

            role:
                "user",

            parts: [

                {

                    text:
                        prompt

                }

            ]

        }

    ];


    return await callGemini(
        contents
    );

}


/* =====================================================
   NORMAL CHAT ROUTE
   ===================================================== */

app.post(
    "/chat",
    async function (req, res) {

        try {

            const userMessage =
                req.body.message;


            if (
                !userMessage ||
                !String(userMessage).trim()
            ) {

                return res.status(400).send(
                    "Message is required."
                );

            }


            console.log(
                "Text question received:",
                userMessage
            );


            const answer =
                await askGeminiText(
                    String(userMessage)
                );


            res.setHeader(
                "Content-Type",
                "text/plain; charset=utf-8"
            );


            res.send(
                answer
            );

        }

        catch (error) {

            console.error(
                "Third Eye chat error:",
                error
            );


            if (
                !res.headersSent
            ) {

                res.status(500).send(

                    "Third Eye AI error: " +
                    error.message

                );

            }

        }

    }
);


/* =====================================================
   GEMINI VISION
   ===================================================== */

async function askVisionModel(
    imageBase64,
    userMessage,
    res,
    mimeType
) {

    try {

        let cleanBase64;


        if (
            Buffer.isBuffer(
                imageBase64
            )
        ) {

            cleanBase64 =
                imageBase64.toString(
                    "base64"
                );

        }

        else if (
            typeof imageBase64 ===
            "string"
        ) {

            cleanBase64 =
                imageBase64;


            if (
                cleanBase64.startsWith(
                    "data:"
                )
            ) {

                cleanBase64 =
                    cleanBase64.substring(
                        cleanBase64.indexOf(",") + 1
                    );

            }

        }

        else {

            throw new Error(
                "Invalid image data."
            );

        }


        if (
            !mimeType
        ) {

            mimeType =
                "image/jpeg";

        }


        console.log(
            "Sending image to Gemini..."
        );


        const contents = [

            {

                role:
                    "user",

                parts: [

                    {

                        text:
                            userMessage ||
                            "Analyze this image carefully and describe what you see."

                    },

                    {

                        inline_data: {

                            mime_type:
                                mimeType,

                            data:
                                cleanBase64

                        }

                    }

                ]

            }

        ];


        const answer =
            await callGemini(
                contents
            );


        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );


        res.send(
            answer
        );

    }

    catch (error) {

        console.error(
            "Gemini Vision error:",
            error
        );


        if (
            !res.headersSent
        ) {

            res.status(500).send(

                "Third Eye Vision error: " +
                error.message

            );

        }

    }

}


/* =====================================================
   EXTRACT DOCUMENT TEXT
   TXT / DOCX / PDF
   ===================================================== */

async function extractTextFromFile(
    file
) {

    const fileName =
        file.originalname
            .toLowerCase();


    /* =================================================
       TXT
       ================================================= */

    if (
        fileName.endsWith(".txt")
    ) {

        return file.buffer.toString(
            "utf8"
        );

    }


    /* =================================================
       DOCX
       ================================================= */

    if (
        fileName.endsWith(".docx")
    ) {

        const result =
            await mammoth.extractRawText({

                buffer:
                    file.buffer

            });


        return result.value;

    }


    /* =================================================
       PDF
       ================================================= */

    if (
        fileName.endsWith(".pdf")
    ) {

        const parser =
            new PDFParse({

                data:
                    new Uint8Array(
                        file.buffer
                    )

            });


        try {

            const result =
                await parser.getText();


            return result.text;

        }

        finally {

            await parser.destroy();

        }

    }


    throw new Error(
        "Unsupported document type."
    );

}


/* =====================================================
   CHAT WITH FILE
   ===================================================== */

app.post(
    "/chat-with-file",
    upload.single("file"),
    async function (req, res) {

        try {

            if (
                !req.file
            ) {

                return res.status(400).send(
                    "No file was uploaded."
                );

            }


            const userMessage =
                req.body.message ||
                "What is this file about?";


            const fileName =
                req.file.originalname
                    .toLowerCase();


            console.log(
                "File received:",
                req.file.originalname
            );

            console.log(
                "File MIME type:",
                req.file.mimetype
            );


            /* =================================================
               IMAGE
               ================================================= */

            if (

                fileName.endsWith(".jpg") ||

                fileName.endsWith(".jpeg") ||

                fileName.endsWith(".png") ||

                fileName.endsWith(".webp")

            ) {

                const imageBase64 =
                    req.file.buffer.toString(
                        "base64"
                    );


                await askVisionModel(

                    imageBase64,

                    userMessage,

                    res,

                    req.file.mimetype ||
                    (
                        fileName.endsWith(".webp")
                            ? "image/webp"
                            : "image/jpeg"
                    )

                );


                return;

            }


            /* =================================================
               PDF
               ================================================= */

            if (
                fileName.endsWith(".pdf")
            ) {

                console.log(
                    "Reading PDF..."
                );


                let documentText = "";


                try {

                    documentText =
                        await extractTextFromFile(
                            req.file
                        );

                }

                catch (pdfError) {

                    console.error(
                        "PDF text extraction error:",
                        pdfError
                    );

                    documentText = "";

                }


                /* =================================================
                   PDF TEXT FOUND
                   ================================================= */

                if (
                    documentText &&
                    documentText.trim()
                ) {

                    const trimmedText =
                        documentText.substring(
                            0,
                            120000
                        );


                    const prompt =
                        "You are Third Eye, a helpful AI assistant.\n\n" +

                        "The user uploaded a PDF.\n\n" +

                        "Use the PDF text below as the primary " +
                        "source for your answer.\n\n" +

                        "PDF TEXT:\n\n" +

                        "------------------------------\n\n" +

                        trimmedText +

                        "\n\n------------------------------\n\n" +

                        "USER QUESTION:\n\n" +

                        userMessage;


                    const contents = [

                        {

                            role:
                                "user",

                            parts: [

                                {

                                    text:
                                        prompt

                                }

                            ]

                        }

                    ];


                    const answer =
                        await callGemini(
                            contents
                        );


                    res.setHeader(
                        "Content-Type",
                        "text/plain; charset=utf-8"
                    );


                    res.send(
                        answer
                    );


                    return;

                }


                /* =================================================
                   PDF VISION FALLBACK
                   ================================================= */

                console.log(
                    "PDF text extraction empty. Using PDF vision."
                );


                const pages = [];


                const document =
                    await pdf(

                        req.file.buffer,

                        {

                            scale:
                                1.5

                        }

                    );


                for await (
                    const page of document
                ) {

                    pages.push(
                        page
                    );

                    break;

                }


                if (
                    pages.length === 0
                ) {

                    return res.status(400).send(
                        "Could not read the PDF."
                    );

                }


                const imageBase64 =
                    Buffer
                        .from(
                            pages[0]
                        )
                        .toString(
                            "base64"
                        );


                await askVisionModel(

                    imageBase64,

                    userMessage,

                    res,

                    "image/png"

                );


                return;

            }


            /* =================================================
               TXT / DOCX
               ================================================= */

            if (

                fileName.endsWith(".txt") ||

                fileName.endsWith(".docx")

            ) {

                console.log(
                    "Extracting document text:",
                    req.file.originalname
                );


                const documentText =
                    await extractTextFromFile(
                        req.file
                    );


                if (
                    !documentText ||
                    !documentText.trim()
                ) {

                    return res.status(400).send(
                        "I couldn't extract readable text from this file."
                    );

                }


                const trimmedText =
                    documentText.substring(
                        0,
                        120000
                    );


                const prompt =
                    "You are Third Eye, a helpful AI assistant.\n\n" +

                    "The user uploaded a document.\n\n" +

                    "Use the document below as the primary " +
                    "source for answering the user's question.\n\n" +

                    "DOCUMENT:\n\n" +

                    "------------------------------\n\n" +

                    trimmedText +

                    "\n\n------------------------------\n\n" +

                    "USER QUESTION:\n\n" +

                    userMessage;


                const contents = [

                    {

                        role:
                            "user",

                        parts: [

                            {

                                text:
                                    prompt

                            }

                        ]

                    }

                ];


                const answer =
                    await callGemini(
                        contents
                    );


                res.setHeader(
                    "Content-Type",
                    "text/plain; charset=utf-8"
                );


                res.send(
                    answer
                );


                return;

            }


            /* =================================================
               UNSUPPORTED FILE
               ================================================= */

            return res.status(400).send(

                "Unsupported file type. Supported files: " +
                "JPG, JPEG, PNG, WEBP, PDF, TXT and DOCX."

            );

        }

        catch (error) {

            console.error(
                "File chat error:",
                error
            );


            if (
                !res.headersSent
            ) {

                res.status(500).send(

                    "Third Eye could not process the attached file: " +
                    error.message

                );

            }

        }

    }
);


/* =====================================================
   MULTER ERROR HANDLER
   ===================================================== */

app.use(
    function (
        error,
        req,
        res,
        next
    ) {

        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).send(

                    "The file is too large. Maximum size is 20 MB."

                );

            }

        }


        console.error(
            "Upload error:",
            error
        );


        if (
            !res.headersSent
        ) {

            res.status(500).send(

                "Something went wrong while processing the file."

            );

        }

    }
);


/* =====================================================
   START SERVER
   ===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    function () {

        console.log(
            "=================================="
        );

        console.log(
            "Third Eye server running!"
        );

        console.log(
            "Port:"
        );

        console.log(
            PORT
        );

        console.log(
            "Chatbot:"
        );

        console.log(
            "/chatbot"
        );

        console.log(
            "Gemini API:"
        );

        console.log(
            GEMINI_API_KEY
                ? "Configured"
                : "MISSING"
        );

        console.log(
            "Chatbot folder:"
        );

        console.log(
            chatbotFolder
        );

        console.log(
            "Chatbot file:"
        );

        console.log(
            chatbotFile
        );

        console.log(
            "=================================="
        );

    }
);
