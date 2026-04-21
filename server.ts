import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Paper {
  id: number;
  title: string;
  unitCode: string;
  year: number;
  pdfUrl: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory storage (temporary)
  let papers: Paper[] = [
    {
      id: 1,
      title: "Introduction to Calculus - Finals 2023",
      unitCode: "MTH101",
      year: 2023,
      pdfUrl: "https://www.maths.cam.ac.uk/sites/www.maths.cam.ac.uk/files/prezip/tripos/examples/ia_calc.pdf",
    },
    {
      id: 2,
      title: "Data Engineering Principles",
      unitCode: "CS204",
      year: 2022,
      pdfUrl: "https://www.cs.princeton.edu/courses/archive/fall22/cos226/lectures/01Introduction.pdf",
    },
    {
      id: 3,
      title: "Artificial Intelligence: Foundations and Applications",
      unitCode: "AI300",
      year: 2023,
      pdfUrl: "https://ai.stanford.edu/~latombe/cs329/syllabus.pdf",
    },
    {
      id: 4,
      title: "Operating Systems - Case Study Exam",
      unitCode: "OS202",
      year: 2024,
      pdfUrl: "https://pdos.csail.mit.edu/6.828/2024/readings/rice-os.pdf",
    },
    {
      id: 5,
      title: "Digital Logic & Computer Organization",
      unitCode: "EE102",
      year: 2021,
      pdfUrl: "https://cse.iitkgp.ac.in/~pds/notes/digital_logic.pdf",
    }
  ];

  // API ROUTES
  app.get("/api/papers", (req, res) => {
    res.json(papers);
  });

  app.post("/api/papers", (req, res) => {
    const { title, unitCode, year, pdfUrl } = req.body;
    
    if (!title || !unitCode || !year || !pdfUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newPaper: Paper = {
      id: papers.length > 0 ? Math.max(...papers.map(p => p.id)) + 1 : 1,
      title,
      unitCode,
      year: Number(year),
      pdfUrl,
    };

    papers.push(newPaper);
    res.json(newPaper);
  });

  app.put("/api/papers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const { title, unitCode, year, pdfUrl } = req.body;
    const index = papers.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Paper not found" });
    }

    papers[index] = {
      ...papers[index],
      title: title || papers[index].title,
      unitCode: unitCode || papers[index].unitCode,
      year: year ? Number(year) : papers[index].year,
      pdfUrl: pdfUrl || papers[index].pdfUrl,
    };

    res.json(papers[index]);
  });

  app.delete("/api/papers/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const initialLength = papers.length;
    papers = papers.filter(p => p.id !== id);

    if (papers.length === initialLength) {
      return res.status(404).json({ error: "Paper not found" });
    }

    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
