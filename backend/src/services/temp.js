// profileData.js

const resume = `
ALEXANDER J. MONTGOMERY
1492 Evergreen Terrace, Portland, OR 97205
Phone: (503) 555-0198 | Email: alex.j.montgomery@email.com
LinkedIn: linkedin.com/in/alexjmontgomery | GitHub: github.com/almontgo_dev | Portfolio: alexmontgomery.dev

PROFESSIONAL SUMMARY
Detail-oriented and adaptable Senior Full-Stack Engineer with 8+ years of experience architecting scalable web applications, optimizing backend microservices, and leading agile cross-functional teams. Proven track record of reducing system latency by 35% and mentoring junior developers to achieve 100% code-review pass rates within their first 90 days.

EXPERIENCE
TechNova Solutions, Portland, OR
Lead Software Engineer (March 2020 – Present)
- Spearheaded the migration of a legacy monolithic architecture to AWS-hosted microservices (Node.js/Express), resulting in a 40% reduction in server costs and a 25% increase in deployment speed.
- Managed a team of 5 engineers, conducting bi-weekly 1-on-1s, quarterly performance reviews, and sprint planning using Jira and Agile methodologies.
- Implemented automated end-to-end testing utilizing Cypress, elevating total test coverage from 45% to 88%.
- Designed a real-time data synchronization pipeline using Apache Kafka and Redis, processing over 2 million transactions daily with zero data loss.

Pioneer Digital, Seattle, WA
Full-Stack Developer (June 2016 – February 2020)
- Developed and maintained 15+ interactive single-page applications (SPAs) using React.js, Redux, and styled-components for high-profile e-commerce clients.
- Integrated third-party payment gateways (Stripe, PayPal) and optimized checkout flows, boosting conversion rates by 18% in Q4 2018.
- Collaborated closely with UX/UI designers via Figma to ensure pixel-perfect, WCAG 2.1 AA accessible web components.

EDUCATION
University of Washington, Seattle, WA
Bachelor of Science in Computer Science (Cum Laude)
Graduated: May 2016 | GPA: 3.78/4.0
Relevant Coursework: Advanced Data Structures, Cloud Computing Architectures, Relational Database Management, Machine Learning Fundamentals.
Honors: Dean's List (2014-2016), 1st Place in UW Annual Hackathon (2015).

TECHNICAL SKILLS
Languages: JavaScript (ES6+), TypeScript, Python 3.9, SQL (PostgreSQL, MySQL), HTML5, CSS3/SASS.
Frameworks/Libraries: React, Next.js, Vue.js, Node.js, Express, Django, Tailwind CSS.
Tools/Platforms: Git, Docker, Kubernetes, AWS (EC2, S3, Lambda, RDS), CI/CD (GitHub Actions, Jenkins), Webpack, Jest.
Soft Skills: Cross-functional collaboration, technical writing, empathy-driven leadership, conflict resolution.

CERTIFICATIONS
- AWS Certified Solutions Architect – Associate (Issued: Jan 2022, Expires: Jan 2025)
- Certified ScrumMaster (CSM) – Scrum Alliance (Issued: Aug 2021)

LANGUAGES
English (Native), Spanish (Professional Working Proficiency), Japanese (Basic).
`;

const jobDescription = `
JOB TITLE: Senior Full-Stack Application Developer
COMPANY: QuantumLeap Technologies Inc.
LOCATION: Austin, TX (Hybrid - 2 days in-office / 3 days remote)
SALARY RANGE: $135,000 - $165,000 base + 10% annual bonus target + Equity (RSUs)

ABOUT US:
QuantumLeap Technologies is a Series C funded fintech startup revolutionizing how small businesses manage global supply chain payments. We process over $500M in transactions monthly and are growing our engineering department by 30% this year to support our expansion into the European market.

THE ROLE:
We are seeking an obsessive, detail-oriented Senior Full-Stack Application Developer to join our Core Transactions Squad. Reporting directly to the VP of Engineering, you will be responsible for building secure, low-latency financial dashboards and robust backend APIs.

KEY RESPONSIBILITIES:
- Architect, build, and deploy highly scalable web applications using TypeScript, React, and Node.js.
- Take ownership of the entire software development lifecycle, from technical design documents (TDDs) to post-deployment monitoring using Datadog.
- Collaborate closely with Product Managers and Compliance Officers to ensure all features meet stringent PCI-DSS and GDPR regulatory requirements.
- Optimize database queries (PostgreSQL) to maintain sub-50ms response times for financial ledger retrievals.
- Mentor 2-3 mid-level developers through rigorous but constructive PR reviews and pair programming sessions.

REQUIREMENTS:
- Minimum of 6 years of professional software engineering experience in a high-growth environment.
- Deep expertise in JavaScript/TypeScript and the React ecosystem (hooks, context, state management).
- Strong fundamental understanding of RESTful API design, GraphQL, and event-driven architectures.
- Experience with containerization (Docker) and cloud deployment on AWS or GCP.
- A relentless attention to detail—you hate technical debt and love writing comprehensive unit tests.

NICE-TO-HAVES:
- Previous experience in the fintech, banking, or payments industry.
- Familiarity with Rust or Go for high-performance microservices.
- Experience building internal tooling or open-source contributions.

BENEFITS:
- 100% company-paid health, dental, and vision insurance for employees and 80% for dependents.
- 401(k) with a 5% company match, fully vested from day one.
- Unlimited PTO (with a mandatory 3-week minimum required time off to prevent burnout).
- $2,000 annual home office stipend and $1,500 annual learning & development budget.
- Catered lunches on in-office days and a dog-friendly workspace.

QuantumLeap is an Equal Opportunity Employer. We celebrate diversity and are committed to creating an inclusive environment for all employees.
`;

const selfDescription = `
My name is Alexander J. Montgomery, and I am a 32-year-old software engineer, amateur astronomer, and dedicated sourdough baker based in Portland, Oregon. 

From a professional standpoint, I am deeply analytical and driven by a desire to solve complex architectural puzzles. I thrive in environments that demand order out of chaos. I am the kind of engineer who cannot sleep if there is a memory leak in a production environment, yet I am also fiercely protective of my team's work-life balance. I believe that writing code is a secondary skill; the primary skill is understanding human problems and translating them into logical systems. I communicate directly but with a heavy dose of empathy, knowing that behind every failing test or missed deadline is a human being trying their best.

On a personal level, I grew up in a small coastal town in Washington State, which instilled in me a profound appreciation for nature and patience. I spend my weekends either hiking the Columbia River Gorge with my golden retriever, Barnaby, or tinkering with my 8-inch Dobsonian telescope in my backyard. I am naturally introverted but incredibly loyal to my small circle of friends. 

I am a creature of habit: I start every morning at 6:15 AM with a pour-over coffee (Ethiopian Yirgacheffe, precisely 22 grams of coffee to 350 grams of water at 205°F) and 20 minutes of journaling before I ever look at a screen. I am intensely curious, currently teaching myself conversational Japanese and the history of mid-century architecture. My long-term goal isn't just to reach a Director-level engineering role, but to eventually retire on a few acres of land, build my own observatory, and teach coding to underprivileged high school students. I value authenticity, quiet competence, and the beauty of a perfectly executed plan over flashiness or loud ego.
`;
module.exports = { resume, jobDescription, selfDescription };