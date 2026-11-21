import { useEffect, useRef, useState } from "react";

const experience = [
  {
    date: "Apr 2026 — Present",
    location: "Bengaluru, India",
    role: "Digital Specialist Engineer",
    company: "Infosys",
    points: [
      "Developing agentic AI solutions with the Infosys Agent Control Framework to automate the Software Development Life Cycle.",
      "Integrating Model Context Protocol tools that connect agents with external APIs and development environments.",
      "Building reusable Agent Skills for requirements analysis, development, code review, and testing."
    ]
  },
  {
    date: "Jan — May 2025",
    location: "Gurugram, India",
    role: "AI Intern",
    company: "VDOIT",
    points: [
      "Optimized ML models, reducing training time by 20% and improving predictive analytics.",
      "Improved real-time application accuracy by 15% through preprocessing and feature engineering.",
      "Created technical proposals and delivered hands-on AI training with 95% client satisfaction."
    ]
  },
  {
    date: "Mar — Nov 2024",
    location: "Remote",
    role: "Advanced AI Data Trainer",
    company: "Invisible Technologies",
    points: [
      "Trained and fine-tuned 5+ LLMs using Reinforcement Learning from Human Feedback.",
      "Evaluated AI-generated responses for accuracy, reasoning, and instruction-following.",
      "Guided technical teams across AI projects to optimize performance and milestones."
    ]
  }
];

const projects = [
  {
    number: "01",
    status: "Multi-agent system",
    title: "Clinical Discharge Audit System",
    description: "Automates clinical document processing with Monitor and Extractor agents, file tracking, and reliable duplicate detection.",
    tags: ["Python", "LangGraph", "FastAPI", "OCR"],
    metric: "95%",
    metricLabel: "Precision rate",
    featured: true
  },
  {
    number: "02",
    status: "AI operations",
    title: "AI Incident Detection & RCA",
    description: "Monitors application logs, detects anomalies, and generates root-cause recommendations with human-in-the-loop approval.",
    tags: ["Python", "LangGraph", "LLMs", "FastAPI"],
    metric: "96%",
    metricLabel: "Analysis accuracy"
  }
];

const skills = [
  ["Generative AI", "LLMs, RAG, Prompt Engineering, Tool Calling, MCP, Agent Skills, Guardrails, Agentic AI, ACF"],
  ["AI & Machine Learning", "Machine Learning, Deep Learning, NLP, TensorFlow, PyTorch, Scikit-learn, RLHF"],
  ["Engineering", "Python, Java, SQL, R, FastAPI, Flask, Spring Boot, HTML, CSS"],
  ["Data & Tools", "PostgreSQL, MongoDB, Git, GitHub, Jira, Power BI, Excel, Data Visualization"]
];

function Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I can answer questions about Roshni's experience, projects, skills, education, and achievements." }
  ]);
  const history = useRef([]);
  const messagesRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const message = text.trim();
    if (!message || busy) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setBusy(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: history.current.slice(-8) })
      });
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The chat API returned a web page instead of JSON. Deploy the backend and set VITE_API_URL to its public URL."
        );
      }
      if (!response.ok) throw new Error(data.detail || data.error || "Unable to answer right now.");
      setMessages((current) => [...current, { role: "assistant", text: data.answer }]);
      history.current = [
        ...history.current,
        { role: "user", content: message },
        { role: "assistant", content: data.answer }
      ].slice(-8);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={`chat-launcher ${open ? "hidden" : ""}`} type="button" aria-label="Open AI resume assistant" onClick={() => setOpen(true)}>
        <span className="chat-launcher-icon">AI</span>
        <span>Ask about Roshni</span>
      </button>
      <aside className={`chat-panel ${open ? "open" : ""}`} aria-label="Roshni's AI resume assistant" aria-hidden={!open}>
        <header className="chat-header">
          <div><p>AI Resume Assistant</p><span><i /> Available</span></div>
          <button className="chat-close" type="button" aria-label="Close chat" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className="chat-messages" ref={messagesRef}>
          {messages.map((message, index) => (
            <div className={`chat-message chat-message-${message.role}`} key={index}>{message.text}</div>
          ))}
          {messages.length === 1 && (
            <div className="chat-suggestions">
              {["What does Roshni do?", "Tell me about her projects", "What are her key skills?"].map((question) => (
                <button type="button" key={question} onClick={() => sendMessage(question)}>{question}</button>
              ))}
            </div>
          )}
        </div>
        <form className="chat-form" onSubmit={(event) => { event.preventDefault(); sendMessage(input); }}>
          <label className="sr-only" htmlFor="chat-input">Ask about Roshni</label>
          <input id="chat-input" value={input} maxLength={500} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question..." disabled={busy} />
          <button type="submit" aria-label="Send message" disabled={busy}>↗</button>
        </form>
      </aside>
    </>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app">
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark">RD</span><span>Roshni Dubey</span></a>
        <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><span /><span /></button>
        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
          <a href="#projects" onClick={() => setMenuOpen(false)}>Projects</a>
          <a href="#skills" onClick={() => setMenuOpen(false)}>Skills</a>
          <a className="nav-contact" href="mailto:roshnie1101@gmail.com">Let's talk <span>↗</span></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> AI Engineer · Bengaluru, India</p>
            <h1>Building intelligent systems <em>that work.</em></h1>
            <p className="hero-lead">I design agentic AI solutions and LLM-powered applications that turn complex workflows into reliable, automated outcomes.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#projects">Explore my work <span>↓</span></a>
              <a className="button button-secondary" href="mailto:roshnie1101@gmail.com">Email me <span>↗</span></a>
            </div>
          </div>
          <div className="hero-visual" aria-label="AI system capabilities">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="orb-center"><span className="orb-grid" /><span className="orb-core">AI</span></div>
            <div className="data-chip chip-one"><span>01</span> Agentic systems</div>
            <div className="data-chip chip-two"><span>02</span> LLM applications</div>
            <div className="data-chip chip-three"><span>03</span> SDLC automation</div>
          </div>
        </section>

        <section className="proof-strip">
          <div><strong>5+</strong><span>LLMs trained & fine-tuned</span></div>
          <div><strong>96%</strong><span>Incident analysis accuracy</span></div>
          <div><strong>95%</strong><span>Clinical audit precision</span></div>
          <div><strong>Top 9</strong><span>out of 960 hackathon teams</span></div>
        </section>

        <section className="section experience" id="experience">
          <div className="section-heading"><p className="section-index">01 / Experience</p><h2>Where I've made an impact.</h2></div>
          <div className="timeline">
            {experience.map((item) => (
              <article className="timeline-item" key={item.company}>
                <div className="timeline-meta"><span>{item.date}</span><span>{item.location}</span></div>
                <div className="timeline-content"><h3>{item.role}</h3><p className="company">{item.company}</p><ul>{item.points.map((point) => <li key={point}>{point}</li>)}</ul></div>
              </article>
            ))}
          </div>
        </section>

        <section className="section projects" id="projects">
          <div className="section-heading"><p className="section-index">02 / Selected projects</p><h2>Built to solve real problems.</h2></div>
          <div className="project-grid">
            {projects.map((project) => (
              <article className={`project-card ${project.featured ? "project-featured" : ""}`} key={project.number}>
                <div className="project-topline"><span>{project.number}</span><span className="project-status">{project.status}</span></div>
                <div className={`project-icon ${project.featured ? "" : "incident-icon"}`}>
                  {project.featured ? <><div className="document-lines"><i /><i /><i /></div><div className="agent-node" /></> : <><div className="signal-ring" /><div className="signal-core" /><div className="signal-line" /></>}
                </div>
                <div className="project-info">
                  <h3>{project.title}</h3><p>{project.description}</p>
                  <div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="project-result"><strong>{project.metric}</strong><span>{project.metricLabel}</span></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section skills" id="skills">
          <div className="section-heading"><p className="section-index">03 / Technical skills</p><h2>My technical toolkit.</h2></div>
          <div className="skill-grid">
            {skills.map(([title, text], index) => <article key={title}><span className="skill-number">0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="section about">
          <div className="education-card">
            <p className="section-index">04 / Education</p><h2>B.Tech in Computer Science & Engineering</h2>
            <p className="degree">Artificial Intelligence & Machine Learning</p>
            <div className="education-meta"><span>Guru Jambheshwar University</span><span>CGPA 7.99 / 10</span></div>
          </div>
          <div className="achievement-card">
            <p className="section-index">Recognition</p>
            <ul><li><span>01</span> Top 9 teams at IIT Mandi Catalyst Hackathon — out of 960 teams</li><li><span>02</span> Top 3 host and influential speaker at university events</li></ul>
          </div>
        </section>
      </main>

      <footer>
        <div><p className="footer-kicker">Have a project in mind?</p><a className="footer-email" href="mailto:roshnie1101@gmail.com">Let's build something intelligent.</a></div>
        <div className="footer-bottom"><p>© 2026 Roshni Dubey</p><div className="footer-links"><a href="mailto:roshnie1101@gmail.com">Email</a><a href="#top">Top ↑</a></div></div>
      </footer>
      <Chat />
    </div>
  );
}
