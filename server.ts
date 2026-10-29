import express from "express";
import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import type { AIProvider } from "./src/services/aiProvider.ts";
import {
  GeminiAIProvider,
  CustomEndpointProvider,
  OfflineAIProvider,
} from "./src/services/aiProvider.ts";
import type { ProcessedDocument } from "./src/services/documentProcessor.ts";
import {
  processPdfBuffer,
  retrieveRelevantPassages,
} from "./src/services/documentProcessor.ts";

dotenv.config();
process.env.DISABLE_HMR = "true";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Port detection: check CLI arguments (--port 3000) or PORT env var, fallback to 3000
function getPort(): number {
  const portArgIndex = process.argv.indexOf("--port");
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    return parseInt(process.argv[portArgIndex + 1], 10);
  }
  if (process.env.PORT) {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}
const PORT = getPort();

// Body parser
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// In-memory document storage with auto-cleanup (2 hours)
const documentsStore = new Map<string, ProcessedDocument>();

// Periodic cleanup of documents older than 2 hours to prevent memory buildup
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, doc] of documentsStore.entries()) {
    const docTime = new Date(doc.uploadedAt).getTime();
    if (docTime < twoHoursAgo) {
      documentsStore.delete(id);
    }
  }
}, 30 * 60 * 1000);

// Initialize Replaceable AI Provider & Fallback Engine
let activeProvider: AIProvider;
let geminiProvider: AIProvider | null = null;

const initialGeminiKey = process.env.GEMINI_API_KEY;
if (initialGeminiKey && initialGeminiKey !== "MY_GEMINI_API_KEY") {
  geminiProvider = new GeminiAIProvider(initialGeminiKey);
}

function initProvider(type: "gemini" | "custom" | "offline" = "gemini", customEndpoint?: string, customModel?: string) {
  if (type === "custom") {
    activeProvider = new CustomEndpointProvider(customEndpoint || "http://localhost:11434/v1", customModel || "llama3:8b");
  } else if (type === "offline") {
    activeProvider = new OfflineAIProvider();
  } else {
    activeProvider = geminiProvider || new OfflineAIProvider();
  }
}

// Initial bootstrap
initProvider("gemini");

/**
 * Execute AI call through activeProvider with automatic graceful fallback to Gemini
 * when the configured provider (e.g. localhost Ollama in a cloud container) is unreachable.
 */
async function executeWithFallback<T>(
  actionName: string,
  fn: (provider: AIProvider) => Promise<T>
): Promise<T> {
  try {
    return await fn(activeProvider);
  } catch (err: any) {
    if (geminiProvider && geminiProvider.isConfigured && activeProvider !== geminiProvider) {
      console.info(`[${actionName}] Configured provider (${activeProvider.name}) was unreachable. Seamlessly resolving via Gemini 3.8 Flash.`);
      return await fn(geminiProvider);
    }
    throw err;
  }
}

// Multer memory storage for single PDF processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only PDF files are supported."));
    }
  },
});

// Multer memory storage for batch / folder uploads (up to 50 files)
// Gracefully ignores non-PDF files without throwing an error that would abort the whole folder
const batchUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 50,
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      // Pass false to safely ignore non-PDF files (e.g. .DS_Store, images)
      cb(null, false);
    }
  },
});

/* ==========================================================================
   API ROUTES
   ========================================================================== */

// 1. Health check & Provider Info
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "Levi AI Engine",
    provider: {
      name: activeProvider.name,
      model: activeProvider.model,
      isConfigured: activeProvider.isConfigured,
    },
    activeDocumentsCount: documentsStore.size,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/provider-info", (_req: Request, res: Response) => {
  res.json({
    name: activeProvider.name,
    model: activeProvider.model,
    isConfigured: activeProvider.isConfigured,
    availableProviders: [
      { id: "gemini", name: "Gemini 3.8 Flash (Server-Side)", defaultModel: "gemini-3.8-flash" },
      { id: "custom", name: "Open-Weight / Custom Endpoint (Ollama, vLLM)", defaultModel: "llama3:8b" },
      { id: "offline", name: "Offline / Disconnected Test Mode", defaultModel: "None" },
    ],
  });
});

// Configure or switch AI Provider
app.post("/api/provider-config", (req: Request, res: Response) => {
  try {
    const { providerType, customEndpoint, customModel } = req.body;
    if (providerType === "custom" || providerType === "offline" || providerType === "gemini") {
      initProvider(providerType, customEndpoint, customModel);
      return res.json({
        success: true,
        message: `Switched AI provider to: ${activeProvider.name}`,
        provider: {
          name: activeProvider.name,
          model: activeProvider.model,
          isConfigured: activeProvider.isConfigured,
        },
      });
    }
    return res.status(400).json({ error: "Invalid providerType. Expected 'gemini', 'custom', or 'offline'." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to configure provider." });
  }
});

// 2. Document Upload & Text Extraction
app.post("/api/documents/upload", (req: Request, res: Response) => {
  upload.single("file")(req, res, async (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File size exceeds the 10MB maximum limit. Please upload a smaller PDF.",
        });
      }
      return res.status(400).json({ error: err.message || "Failed to upload file." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided. Please attach a valid PDF." });
    }

    try {
      const processedDoc = await processPdfBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.size
      );

      // Store in memory
      documentsStore.set(processedDoc.id, processedDoc);

      res.status(201).json({
        id: processedDoc.id,
        filename: processedDoc.filename,
        fileSize: processedDoc.fileSize,
        pageCount: processedDoc.pageCount,
        isScannedOnly: processedDoc.isScannedOnly,
        passagesCount: processedDoc.passages.length,
        uploadedAt: processedDoc.uploadedAt,
        message: processedDoc.isScannedOnly
          ? "Document uploaded, but contains no selectable text layer (likely scanned or image-based). Text extraction yielded no readable characters. OCR is not supported in the initial MVP."
          : `Extracted ${processedDoc.pageCount} page(s) and ${processedDoc.passages.length} readable passage(s).`,
      });
    } catch (processError: any) {
      console.error("PDF processing failed:", processError);
      res.status(422).json({
        error: `Could not extract text from PDF: ${processError.message || "Unknown error"}`,
      });
    }
  });
});

// 2b. Batch / Folder Upload & Text Extraction (supports full directory uploads)
app.post("/api/documents/batch", (req: Request, res: Response) => {
  batchUpload.array("files", 50)(req, res, async (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "One or more files in the folder exceed the 10MB limit.",
        });
      }
      return res.status(400).json({ error: err.message || "Failed to process folder upload." });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files found in the folder upload." });
    }

    const pdfFiles = files.filter((f) => f.originalname.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      return res.status(400).json({
        error: `No PDF files found in the uploaded folder (${files.length} non-PDF file(s) ignored). Please upload a folder containing .pdf lecture notes or textbooks.`,
      });
    }

    const processedDocs: any[] = [];
    const errors: any[] = [];

    for (const file of pdfFiles) {
      try {
        const processedDoc = await processPdfBuffer(file.buffer, file.originalname, file.size);
        documentsStore.set(processedDoc.id, processedDoc);
        processedDocs.push({
          id: processedDoc.id,
          filename: processedDoc.filename,
          fileSize: processedDoc.fileSize,
          pageCount: processedDoc.pageCount,
          isScannedOnly: processedDoc.isScannedOnly,
          passagesCount: processedDoc.passages.length,
          uploadedAt: processedDoc.uploadedAt,
          message: processedDoc.isScannedOnly
            ? "Uploaded without selectable text (scanned)."
            : `Extracted ${processedDoc.pageCount} page(s).`,
        });
      } catch (procErr: any) {
        errors.push({ filename: file.originalname, error: procErr.message || "Extraction failed" });
      }
    }

    if (processedDocs.length === 0) {
      return res.status(422).json({
        error: `Could not extract text from any PDFs in the folder: ${errors.map((e) => `${e.filename} (${e.error})`).join(", ")}`,
      });
    }

    return res.status(201).json({
      documents: processedDocs,
      totalCount: processedDocs.length,
      ignoredCount: files.length - pdfFiles.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${processedDocs.length} PDF(s) from the folder.${files.length - pdfFiles.length > 0 ? ` (${files.length - pdfFiles.length} non-PDF file(s) ignored)` : ""}`,
    });
  });
});

// Load Sample University Lecture PDF (for immediate testing without local PDF)
app.post("/api/documents/sample", (_req: Request, res: Response) => {
  const samplePages = [
    {
      pageNumber: 1,
      text: `LECTURE 04: TRANSPORT LAYER PROTOCOLS — TCP & UDP
Course: CSC 304 - Computer Networks and Distributed Systems
Instructor: Department of Computer Science & Engineering

1. Overview of the Transport Layer
The transport layer provides logical communication between application processes running on different hosts. While the network layer (IP protocol) handles host-to-host delivery, the transport layer delivers data to specific application processes using 16-bit port numbers.

2. Primary Protocols:
- Transmission Control Protocol (TCP): Connection-oriented, reliable, byte-stream service with flow control, congestion control, and ordered packet delivery.
- User Datagram Protocol (UDP): Connectionless, lightweight, unreliable datagram service without handshakes, flow control, or acknowledgment overhead.`
    },
    {
      pageNumber: 2,
      text: `3. TCP Connection Management: The Three-Way Handshake
Before transmitting application data, TCP establishes a logical connection via a three-way handshake:
1. Step 1 (SYN): The client sends a TCP segment with the SYN bit set to 1 and an initial client sequence number (client_isn).
2. Step 2 (SYN-ACK): The server allocates buffers, chooses its own server initial sequence number (server_isn), and responds with SYN=1 and ACK=client_isn + 1.
3. Step 3 (ACK): The client allocates connection buffers and sends an ACK segment with ACK=server_isn + 1. Application data can accompany this third segment.

Connection Termination (Four-Way Wave):
Either party initiates teardown by sending a segment with FIN=1. The receiving party responds with ACK, finishes pending transmissions, sends its own FIN=1, and waits in TIME_WAIT state (typically 2 * Maximum Segment Lifetime) before final socket closure.`
    },
    {
      pageNumber: 3,
      text: `4. Reliability Mechanisms: Flow Control vs. Congestion Control
A common misconception among undergraduate students is conflating flow control with congestion control:

A. Flow Control (Receiver Protection):
- Purpose: Prevents the sender from overflowing the receiver's application buffer.
- Mechanism: The receiver includes a Receive Window (rwnd) field in the TCP header of every acknowledgment, advertising the remaining free buffer space.
- Sender Constraint: LastByteSent - LastByteAcked <= rwnd.

B. Congestion Control (Network Backbone Protection):
- Purpose: Prevents senders from overwhelming intermediate network routers and communication links.
- Mechanism: Maintained via Congestion Window (cwnd). TCP uses Additive Increase Multiplicative Decrease (AIMD), Slow Start phase, and fast retransmit upon receiving three duplicate ACKs.`
    },
    {
      pageNumber: 4,
      text: `5. User Datagram Protocol (UDP) Characteristics & Use Cases
UDP offers minimal protocol overhead (only 8 bytes header size vs TCP's 20-60 bytes). It provides no delivery guarantees, no retransmissions, and no congestion backoff.

Header Structure:
- Source Port (16 bits)
- Destination Port (16 bits)
- Length (16 bits)
- Checksum (16 bits, optional in IPv4, mandatory in IPv6)

Optimal Applications:
1. Real-time Audio/Video Streaming (VoIP, Zoom, WebRTC): Retransmitting lost audio 300ms later is useless; dropped packets are preferred over playback buffering delays.
2. Domain Name System (DNS): Lightweight single request/response queries fit comfortably in a single UDP packet (port 53).
3. Online Gaming: Position updates require lowest possible latency.`
    }
  ];

  const samplePassages = [
    {
      id: "p-1",
      pageNumber: 1,
      text: "The transport layer provides logical communication between application processes running on different hosts using 16-bit port numbers. TCP is connection-oriented, reliable, and ordered, whereas UDP is connectionless and lightweight."
    },
    {
      id: "p-2",
      pageNumber: 2,
      text: "TCP establishes connection via a Three-Way Handshake: 1. SYN with client sequence number. 2. SYN-ACK with server sequence number and acknowledgment. 3. ACK with acknowledgment. Teardown uses FIN and ACK with a TIME_WAIT state."
    },
    {
      id: "p-3",
      pageNumber: 3,
      text: "Flow control prevents overflowing the receiver's buffer using the advertised Receive Window (rwnd). In contrast, congestion control protects intermediate network routers using the Congestion Window (cwnd) and AIMD algorithm."
    },
    {
      id: "p-4",
      pageNumber: 4,
      text: "UDP has an 8-byte header consisting of Source Port, Destination Port, Length, and Checksum. It is optimal for real-time VoIP, DNS queries, and multiplayer online gaming where low latency is preferred over packet retransmission."
    }
  ];

  const sampleDoc: ProcessedDocument = {
    id: `doc_sample_csc304`,
    filename: "CSC304_Lecture04_Transport_Layer_TCP_UDP.pdf",
    fileSize: 148520,
    pageCount: 4,
    fullText: samplePages.map(p => p.text).join("\n\n"),
    pages: samplePages,
    passages: samplePassages,
    uploadedAt: new Date().toISOString(),
    isScannedOnly: false
  };

  documentsStore.set(sampleDoc.id, sampleDoc);

  res.status(201).json({
    id: sampleDoc.id,
    filename: sampleDoc.filename,
    fileSize: sampleDoc.fileSize,
    pageCount: sampleDoc.pageCount,
    isScannedOnly: false,
    passagesCount: sampleDoc.passages.length,
    uploadedAt: sampleDoc.uploadedAt,
    message: "Sample lecture document loaded successfully."
  });
});

// Get document details
app.get("/api/documents/:id", (req: Request, res: Response) => {
  const doc = documentsStore.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found or session expired." });
  }

  res.json({
    id: doc.id,
    filename: doc.filename,
    fileSize: doc.fileSize,
    pageCount: doc.pageCount,
    isScannedOnly: doc.isScannedOnly,
    uploadedAt: doc.uploadedAt,
    pages: doc.pages,
    samplePassages: doc.passages.slice(0, 5),
  });
});

// Delete document
app.delete("/api/documents/:id", (req: Request, res: Response) => {
  const deleted = documentsStore.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.json({ success: true, message: "Document removed from memory." });
});

// 3. Document-Grounded Q&A
app.post("/api/documents/:id/question", async (req: Request, res: Response) => {
  const doc = documentsStore.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found or has expired." });
  }

  const { question } = req.body;
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Please provide a valid question." });
  }

  if (doc.isScannedOnly) {
    return res.status(422).json({
      error: "This document is an image-only / scanned PDF with no selectable text. Document grounding cannot be performed without an OCR engine.",
    });
  }

  try {
    // 1. Passage retrieval
    const relevantPassages = retrieveRelevantPassages(doc.passages, question.trim(), 4);

    // 2. Query Replaceable AI Provider with fallback
    const result = await executeWithFallback("Q&A", (provider) =>
      provider.askDocumentQuestion(question.trim(), relevantPassages, doc.filename)
    );

    res.json({
      question: question.trim(),
      answer: result.answer,
      citations: result.citations,
      hasGrounding: result.hasGrounding,
      passagesRetrieved: relevantPassages.map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        text: p.text,
      })),
    });
  } catch (err: any) {
    console.info(`[Q&A] Document question could not be resolved: ${err.message}`);
    res.status(500).json({
      error: err.message || "An unexpected error occurred while processing your question.",
    });
  }
});

// 4. Study Mode: Summarize
app.post("/api/study/summarize", async (req: Request, res: Response) => {
  const text = req.body.text || req.body.notes;
  const format = req.body.format || "bullets";
  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return res.status(400).json({ error: "Please enter at least 20 characters of study notes to summarize." });
  }

  try {
    const summaryResult = await executeWithFallback("Study:Summarize", (provider) =>
      provider.summarize(text.trim(), format)
    );
    res.json(summaryResult);
  } catch (err: any) {
    console.info(`[Study] Summarization notice: ${err.message}`);
    res.status(500).json({ error: err.message || "Failed to generate summary." });
  }
});

// 5. Study Mode: Explain Concept
app.post("/api/study/explain", async (req: Request, res: Response) => {
  const { concept, context } = req.body;
  if (!concept || typeof concept !== "string" || concept.trim().length === 0) {
    return res.status(400).json({ error: "Please enter a concept to explain." });
  }

  try {
    const explanation = await executeWithFallback("Study:Explain", (provider) =>
      provider.explainConcept(concept.trim(), context)
    );
    res.json(explanation);
  } catch (err: any) {
    console.info(`[Study] Concept explanation notice: ${err.message}`);
    res.status(500).json({ error: err.message || "Failed to explain concept." });
  }
});

// 6. Study Mode: Generate Quiz
app.post("/api/study/quiz", async (req: Request, res: Response) => {
  const { content, count = 4 } = req.body;
  if (!content || typeof content !== "string" || content.trim().length < 30) {
    return res.status(400).json({ error: "Please provide sufficient study material to generate a practice quiz." });
  }

  try {
    const quiz = await executeWithFallback("Study:Quiz", (provider) =>
      provider.generateQuiz(content.trim(), Math.min(Math.max(1, count), 8))
    );
    res.json({ questions: quiz });
  } catch (err: any) {
    console.info(`[Study] Quiz generation notice: ${err.message}`);
    res.status(500).json({ error: err.message || "Failed to generate quiz." });
  }
});

// 7. Language Mode: Translate
app.post("/api/translate", async (req: Request, res: Response) => {
  const { text, sourceLang = "English", targetLang = "Yoruba" } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Please enter text to translate." });
  }

  const validLangs = ["English", "Yoruba", "Igbo", "Hausa"];
  if (!validLangs.includes(sourceLang) || !validLangs.includes(targetLang)) {
    return res.status(400).json({
      error: `Unsupported language. Levi AI supports: ${validLangs.join(", ")}`,
    });
  }

  try {
    const translation = await executeWithFallback("Translate", (provider) =>
      provider.translate(text.trim(), sourceLang, targetLang)
    );
    res.json(translation);
  } catch (err: any) {
    console.info(`[Translate] Translation notice: ${err.message}`);
    res.status(502).json({ error: err.message || "Failed to complete translation." });
  }
});

// Unmatched API routes handler
app.all("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/* ==========================================================================
   Vite & Static Server Setup
   ========================================================================== */

async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  const distPath = path.resolve(__dirname, "dist");

  if (!isDev && fs.existsSync(distPath) && fs.existsSync(path.join(distPath, "index.html"))) {
    console.log(`[Levi AI] Serving production build from ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.log("[Levi AI] Mounting Vite middleware");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use("*", async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Levi AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Levi AI server:", err);
  process.exit(1);
});
