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
   FOLDER LOCATIONS
   ===================================================== */

/*
   Folder structure:

   Desktop
   │
   ├── Third Eye
   │   ├── Backend
   │   │   ├── server.js
   │   │   └── users.json
   │   │
   │   ├── sukoga.html
   │   ├── style.css
   │   ├── script.js
   │   └── other chatbot files
   │
   └── Third Eye Website
       ├── index.html
       ├── style.css
       └── script.js
*/


/* =====================================================
   MAIN WEBSITE LOCATION
   ===================================================== */

const websiteFolder = path.join(
    __dirname,
    "..",
    "..",
    "Third Eye Website"
);


/* =====================================================
   CHATBOT LOCATION
   ===================================================== */

const chatbotFolder = path.join(
    __dirname,
    ".."
);

const chatbotFile = path.join(
    chatbotFolder,
    "sukoga.html"
);


/* =====================================================
   MIDDLEWARE
   ===================================================== */

app.use(cors());

app.use(
    express.json()
);


/* =====================================================
   MAIN WEBSITE
   ===================================================== */

/*
   http://localhost:3000/

   opens:

   Desktop
   └── Third Eye Website
       └── index.html
*/

app.use(
    express.static(websiteFolder)
);

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                websiteFolder,
                "index.html"
            )
        );

    }
);


/* =====================================================
   CHATBOT
   ===================================================== */

/*
   http://localhost:3000/chatbot

   opens:

   Desktop
   └── Third Eye
       └── sukoga.html
*/

app.get(
    "/chatbot",
    (req, res) => {

        res.sendFile(
            chatbotFile,
            (error) => {

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

    }
);


/*
   Serve chatbot files.

   This allows sukoga.html to load files such as:

   style.css
   script.js
   images
   logos
   icons
   etc.

   Example:

   /chatbot/style.css
   /chatbot/script.js
*/

app.use(
    "/chatbot",
    express.static(chatbotFolder)
);


/* =====================================================
   SERVER SETTINGS
   ===================================================== */

const PORT = 3000;


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

    return JSON.parse(

        fs.readFileSync(

            USERS_FILE,

            "utf8"

        )

    );

}


/* =====================================================
   SAVE USERS
   ===================================================== */

function saveUsers(
    users
) {

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

function hashPassword(
    password
) {

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


    return `${salt}:${hash}`;

}


/* =====================================================
   CHECK PASSWORD
   ===================================================== */

function checkPassword(
    password,
    storedPassword
) {

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


    return crypto.timingSafeEqual(

        Buffer.from(
            hash,
            "hex"
        ),

        Buffer.from(
            originalHash,
            "hex"
        )

    );

}


/* =====================================================
   TOKEN
   ===================================================== */

const TOKEN_SECRET =
    "third-eye-secret-change-this-later";


/* =====================================================
   CREATE TOKEN
   ===================================================== */

function createToken(
    user
) {

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


    return `${data}.${signature}`;

}


/* =====================================================
   SIGN UP
   ===================================================== */

app.post(
    "/signup",
    (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;


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

                    user =>
                        user.email ===
                        cleanEmail

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

        catch (
            error
        ) {

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
    (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


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

                    user =>
                        user.email ===
                        cleanEmail

                );


            if (
                !user
            ) {

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

        catch (
            error
        ) {

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
   NORMAL OLLAMA CHAT
   MODEL: LLAMA 3.2:3B
   ===================================================== */

async function streamFromOllama(

    messages,

    res,

    model = "llama3.2:3b"

) {

    const response =
        await fetch(

            "http://localhost:11434/api/chat",

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        model:
                            model,

                        messages:
                            messages,

                        stream:
                            true

                    })

            }

        );


    if (
        !response.ok
    ) {

        throw new Error(

            "Ollama returned status " +
            response.status

        );

    }


    res.setHeader(

        "Content-Type",

        "text/plain; charset=utf-8"

    );


    res.setHeader(

        "Transfer-Encoding",

        "chunked"

    );


    const reader =
        response.body.getReader();


    const decoder =
        new TextDecoder();


    while (
        true
    ) {

        const {
            value,
            done
        } =
            await reader.read();


        if (
            done
        ) {

            break;

        }


        const chunk =
            decoder.decode(

                value,

                {
                    stream:
                        true
                }

            );


        const lines =
            chunk.split(
                "\n"
            );


        for (
            const line of lines
        ) {

            if (
                !line.trim()
            ) {

                continue;

            }


            try {

                const data =
                    JSON.parse(
                        line
                    );


                if (

                    data.message &&
                    data.message.content

                ) {

                    res.write(

                        data.message.content

                    );

                }

            }

            catch (
                error
            ) {

                // Ignore incomplete JSON chunks

            }

        }

    }


    res.end();

}


/* =====================================================
   QWEN VISION
   MODEL: QWEN3-VL:2B
   ===================================================== */

async function askVisionModel(

    imageBase64,

    userMessage,

    res

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

                        cleanBase64.indexOf(
                            ","
                        ) + 1

                    );

            }

        }

        else {

            throw new Error(

                "Vision image is not a Buffer or Base64 string."

            );

        }


        console.log(
            "Sending image to Qwen Vision..."
        );


        console.log(
            "Image Base64 length:",
            cleanBase64.length
        );


        const response =
            await fetch(

                "http://localhost:11434/api/chat",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            model:
                                "qwen3-vl:2b",

                            messages: [

                                {

                                    role:
                                        "user",

                                    content:
                                        userMessage,

                                    images: [

                                        cleanBase64

                                    ]

                                }

                            ],

                            stream:
                                false

                        })

                }

            );


        if (
            !response.ok
        ) {

            const errorText =
                await response.text();


            console.error(

                "Qwen Vision error:",

                response.status,

                errorText

            );


            throw new Error(

                "Qwen Vision returned status " +
                response.status +
                ": " +
                errorText

            );

        }


        const data =
            await response.json();


        console.log(
            "Qwen Vision response received."
        );


        if (

            !data.message ||
            !data.message.content

        ) {

            throw new Error(

                "Qwen Vision returned an empty response."

            );

        }


        res.setHeader(

            "Content-Type",

            "text/plain; charset=utf-8"

        );


        res.send(
            data.message.content
        );

    }

    catch (
        error
    ) {

        console.error(

            "Qwen Vision model error:",

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

        else {

            res.end();

        }

    }

}


/* =====================================================
   NORMAL CHAT ROUTE
   ===================================================== */

app.post(
    "/chat",
    async (req, res) => {

        try {

            const userMessage =
                req.body.message;


            if (
                !userMessage
            ) {

                return res.status(400).send(

                    "Message is required."

                );

            }


            await streamFromOllama(

                [

                    {

                        role:
                            "user",

                        content:
                            userMessage

                    }

                ],

                res,

                "llama3.2:3b"

            );

        }

        catch (
            error
        ) {

            console.error(

                "Third Eye server error:",

                error

            );


            if (
                !res.headersSent
            ) {

                res.status(500).send(

                    "Sorry, Third Eye could not connect to Llama."

                );

            }

            else {

                res.end();

            }

        }

    }
);


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


    if (
        fileName.endsWith(".txt")
    ) {

        return file.buffer.toString(
            "utf8"
        );

    }


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

    async (req, res) => {

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


            /* =================================================
               IMAGE → QWEN VISION
               ================================================= */

            if (

                fileName.endsWith(".jpg") ||

                fileName.endsWith(".jpeg") ||

                fileName.endsWith(".png")

            ) {

                console.log(

                    "Sending image to Qwen Vision:",

                    req.file.originalname

                );


                const imageBase64 =
                    req.file.buffer.toString(
                        "base64"
                    );


                await askVisionModel(

                    imageBase64,

                    userMessage,

                    res

                );


                return;

            }


            /* =================================================
               PDF → QWEN VISION
               ================================================= */

            if (
                fileName.endsWith(".pdf")
            ) {

                console.log(

                    "Rendering PDF for Vision:",

                    req.file.originalname

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

                        "Could not render the PDF."

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


                console.log(

                    "PDF first page Base64 length:",

                    imageBase64.length

                );


                await askVisionModel(

                    imageBase64,

                    userMessage,

                    res

                );


                return;

            }


            /* =================================================
               TXT / DOCX → LLAMA
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


                const systemPrompt = `

You are Third Eye, a helpful local AI assistant.

The user attached a document.

Use the document below as the primary source
for answering the user's question.

DOCUMENT:

------------------------------

${trimmedText}

------------------------------

`;


                await streamFromOllama(

                    [

                        {

                            role:
                                "system",

                            content:
                                systemPrompt

                        },

                        {

                            role:
                                "user",

                            content:
                                userMessage

                        }

                    ],

                    res,

                    "llama3.2:3b"

                );


                return;

            }


            /* =================================================
               UNSUPPORTED FILE
               ================================================= */

            return res.status(400).send(

                "Unsupported file type. Supported files: JPG, JPEG, PNG, PDF, TXT and DOCX."

            );

        }

        catch (
            error
        ) {

            console.error(

                "File chat error:",

                error

            );


            if (
                !res.headersSent
            ) {

                res.status(500).send(

                    "Third Eye could not process the attached file."

                );

            }

            else {

                res.end();

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

    () => {

        console.log(
            "=================================="
        );

        console.log(
            "Third Eye server running!"
        );

        console.log(
            "Main Website:"
        );

        console.log(
            "http://localhost:" +
            PORT
        );

        console.log(
            "Chatbot:"
        );

        console.log(
            "http://localhost:" +
            PORT +
            "/chatbot"
        );

        console.log(
            "Website folder:"
        );

        console.log(
            websiteFolder
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