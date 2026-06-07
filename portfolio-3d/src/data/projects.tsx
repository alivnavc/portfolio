import AceTernityLogo from "@/components/logos/aceternity";
import SlideShow from "@/components/slide-show";
import { Button } from "@/components/ui/button";
import { TypographyH3, TypographyP } from "@/components/ui/typography";
import { ArrowDownUpIcon, ArrowUpRight, ExternalLink, Link2, MoveUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { RiNextjsFill, RiNodejsFill, RiReactjsFill } from "react-icons/ri";
import {
  SiChakraui,
  SiDocker,
  SiExpress,
  SiFirebase,
  SiJavascript,
  SiMongodb,
  SiPostgresql,
  SiPrisma,
  SiPython,
  SiReactquery,
  SiSanity,
  SiShadcnui,
  SiSocketdotio,
  SiSupabase,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
  SiVuedotjs,
  SiVite,
  SiNetlify,
  SiHtml5,
  SiCss3,
  SiBootstrap,
  SiApachemaven,
  SiCplusplus,
  SiArduino,
} from "react-icons/si";
import { TbBrandFramerMotion } from "react-icons/tb";
import css from "styled-jsx/css";
const BASE_PATH = "/assets/projects-screenshots";

const ProjectsLinks = ({ live, repo }: { live: string; repo?: string }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-start gap-3 my-3 mb-8">
      <Link
        className="font-mono underline flex gap-2"
        rel="noopener"
        target="_new"
        href={live}
      >
        <Button variant={"default"} size={"sm"}>
          Visit Website
          <ArrowUpRight className="ml-3 w-5 h-5" />
        </Button>
      </Link>
      {repo && (
        <Link
          className="font-mono underline flex gap-2"
          rel="noopener"
          target="_new"
          href={repo}
        >
          <Button variant={"default"} size={"sm"}>
            Github
            <ArrowUpRight className="ml-3 w-5 h-5" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export type Skill = {
  title: string;
  bg: string;
  fg: string;
  icon: ReactNode;
};
const PROJECT_SKILLS = {
  next: {
    title: "Next.js",
    bg: "black",
    fg: "white",
    icon: <RiNextjsFill />,
  },
  chakra: {
    title: "Chakra UI",
    bg: "black",
    fg: "white",
    icon: <SiChakraui />,
  },
  node: {
    title: "Node.js",
    bg: "black",
    fg: "white",
    icon: <RiNodejsFill />,
  },
  python: {
    title: "Python",
    bg: "black",
    fg: "white",
    icon: <SiPython />,
  },
  prisma: {
    title: "prisma",
    bg: "black",
    fg: "white",
    icon: <SiPrisma />,
  },
  postgres: {
    title: "PostgreSQL",
    bg: "black",
    fg: "white",
    icon: <SiPostgresql />,
  },
  mongo: {
    title: "MongoDB",
    bg: "black",
    fg: "white",
    icon: <SiMongodb />,
  },
  express: {
    title: "Express",
    bg: "black",
    fg: "white",
    icon: <SiExpress />,
  },
  reactQuery: {
    title: "React Query",
    bg: "black",
    fg: "white",
    icon: <SiReactquery />,
  },
  shadcn: {
    title: "ShanCN UI",
    bg: "black",
    fg: "white",
    icon: <SiShadcnui />,
  },
  aceternity: {
    title: "Aceternity",
    bg: "black",
    fg: "white",
    icon: <AceTernityLogo />,
  },
  tailwind: {
    title: "Tailwind",
    bg: "black",
    fg: "white",
    icon: <SiTailwindcss />,
  },
  docker: {
    title: "Docker",
    bg: "black",
    fg: "white",
    icon: <SiDocker />,
  },
  yjs: {
    title: "Y.js",
    bg: "black",
    fg: "white",
    icon: (
      <span>
        <strong>Y</strong>js
      </span>
    ),
  },
  firebase: {
    title: "Firebase",
    bg: "black",
    fg: "white",
    icon: <SiFirebase />,
  },
  sockerio: {
    title: "Socket.io",
    bg: "black",
    fg: "white",
    icon: <SiSocketdotio />,
  },
  js: {
    title: "JavaScript",
    bg: "black",
    fg: "white",
    icon: <SiJavascript />,
  },
  ts: {
    title: "TypeScript",
    bg: "black",
    fg: "white",
    icon: <SiTypescript />,
  },
  vue: {
    title: "Vue.js",
    bg: "black",
    fg: "white",
    icon: <SiVuedotjs />,
  },
  react: {
    title: "React.js",
    bg: "black",
    fg: "white",
    icon: <RiReactjsFill />,
  },
  sanity: {
    title: "Sanity",
    bg: "black",
    fg: "white",
    icon: <SiSanity />,
  },
  spline: {
    title: "Spline",
    bg: "black",
    fg: "white",
    icon: <SiThreedotjs />,
  },
  gsap: {
    title: "GSAP",
    bg: "black",
    fg: "white",
    icon: "",
  },
  framerMotion: {
    title: "Framer Motion",
    bg: "black",
    fg: "white",
    icon: <TbBrandFramerMotion />,
  },
  supabase: {
    title: "Supabase",
    bg: "black",
    fg: "white",
    icon: <SiSupabase />,
  },
  // +
  vite: {
    title: "Vite",
    bg: "black",
    fg: "white",
    icon: <SiVite />,
  },
  openai: {
    title: "OpenAI",
    bg: "black",
    fg: "white",
    icon: <img src="assets/icons/openai-svgrepo-com_white.svg" alt="OpenAI"/>,
  },
  netlify: {
    title: "Netlify",
    bg: "black",
    fg: "white",
    icon: <SiNetlify/>,
  },
  html: {
    title: "HTML5",
    bg: "black",
    fg: "white",
    icon: <SiHtml5/>,
  },
  css: {
    title: "CSS3",
    bg: "black",
    fg: "white",
    icon: <SiCss3/>,
  },
  bootstrap: {
    title: "Bootstrap",
    bg: "black",
    fg: "white",
    icon: <SiBootstrap/>,
  },
  maven: {
    title: "Maven",
    bg: "black",
    fg: "white",
    icon: <SiApachemaven/>,
  },
  java: {
    title: "Java",
    bg: "black",
    fg: "white",
    icon: <img src="assets/icons/icons8-java.svg" alt="Java"/>,
  },
  cplusplus: {
    title: "C++",
    bg: "black",
    fg: "white",
    icon: <SiCplusplus/>,
  },
  arduino: {
    title: "Arduino",
    bg: "black",
    fg: "white",
    icon: <SiArduino/>,
  },
};
export type Project = {
  id: string;
  category: string;
  title: string;
  src: string;
  screenshots: string[];
  skills: { frontend: Skill[]; backend: Skill[] };
  content: React.ReactNode | any;
  github?: string;
  live: string;
};
const projects: Project[] = [
  {
    id: "invest",
    category: "Multi-Agent · LLM",
    title: "AI Multi-Agent Investment Strategist",
    src: "/assets/projects-screenshots/naveen/invest.png",
    screenshots: ["invest.png"],
    skills: { frontend: [PROJECT_SKILLS.python, PROJECT_SKILLS.openai], backend: [] },
    live: "https://github.com/alivnavc/AI-Multi-Agent-Investment-Strategist",
    github: "https://github.com/alivnavc/AI-Multi-Agent-Investment-Strategist",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            A multi-agent system that researches markets and assembles investment strategies — specialised agents coordinate analysis, risk, and recommendations.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/invest.png`]} />
        </div>
      );
    },
  },
  {
    id: "travel",
    category: "MCP · Multi-Agent",
    title: "Multi-Agent Travel Assistant (custom MCP)",
    src: "/assets/projects-screenshots/naveen/travel.png",
    screenshots: ["travel.png"],
    skills: { frontend: [PROJECT_SKILLS.python, PROJECT_SKILLS.openai], backend: [] },
    live: "https://github.com/alivnavc/Gen-AI-Travel-Agent",
    github: "https://github.com/alivnavc/Gen-AI-Travel-Agent",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            A travel-planning assistant built on a from-scratch Model Context Protocol server, with collaborating agents for search, itinerary and booking flows.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/travel.png`]} />
        </div>
      );
    },
  },
  {
    id: "pentest",
    category: "Security · RL/DPO",
    title: "Autonomous Pentest Agent — SQLi (RL/DPO)",
    src: "/assets/projects-screenshots/naveen/pentest.png",
    screenshots: ["pentest.png"],
    skills: { frontend: [PROJECT_SKILLS.python, PROJECT_SKILLS.openai], backend: [] },
    live: "https://github.com/alivnavc/autonomous-pentest-SQLi--agent",
    github: "https://github.com/alivnavc/autonomous-pentest-SQLi--agent",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            An autonomous multi-agent system for SQL-injection pentesting, trained with an RL / DPO-style preference loop to sharpen its exploit strategy.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/pentest.png`]} />
        </div>
      );
    },
  },
  {
    id: "teams",
    category: "MCP · Graph API",
    title: "Microsoft Teams Meetings MCP Server",
    src: "/assets/projects-screenshots/naveen/teams.png",
    screenshots: ["teams.png"],
    skills: { frontend: [PROJECT_SKILLS.python, PROJECT_SKILLS.node], backend: [] },
    live: "https://github.com/alivnavc/Microsoft-Teams-Meetings-MCP-Server",
    github: "https://github.com/alivnavc/Microsoft-Teams-Meetings-MCP-Server",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            An MCP server to schedule, reschedule, cancel and manage Teams meetings via the Microsoft Graph API — JSON-RPC tools, open-source with 6.5k+ PyPI downloads.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/teams.png`]} />
        </div>
      );
    },
  },
  {
    id: "ctgan",
    category: "Synthetic Data",
    title: "Structured Synthetic Data with CTGAN",
    src: "/assets/projects-screenshots/naveen/ctgan.png",
    screenshots: ["ctgan.png"],
    skills: { frontend: [PROJECT_SKILLS.python], backend: [] },
    live: "https://github.com/alivnavc/Synthetic-Data-Generation-CTGAN",
    github: "https://github.com/alivnavc/Synthetic-Data-Generation-CTGAN",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            Generates high-quality structured synthetic data with CTGAN, preserving column distributions and correlations for safe model training.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/ctgan.png`]} />
        </div>
      );
    },
  },
  {
    id: "finrag",
    category: "RAG · Multi-Agent",
    title: "AI Financial News Assistant (RAG)",
    src: "/assets/projects-screenshots/naveen/finrag.png",
    screenshots: ["finrag.png"],
    skills: { frontend: [PROJECT_SKILLS.python, PROJECT_SKILLS.openai], backend: [] },
    live: "https://github.com/alivnavc/AI-Financial-News-Assistant-RAG",
    github: "https://github.com/alivnavc/AI-Financial-News-Assistant-RAG",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            A retrieval-augmented, multi-agent assistant for financial news — instrumented with LangSmith tracing and RAGAS evaluation.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/finrag.png`]} />
        </div>
      );
    },
  },
  {
    id: "explain",
    category: "Education · Viz",
    title: "Interactive Transformer & ML Explainers",
    src: "/assets/projects-screenshots/naveen/explain.png",
    screenshots: ["explain.png"],
    skills: { frontend: [PROJECT_SKILLS.ts, PROJECT_SKILLS.next, PROJECT_SKILLS.tailwind], backend: [] },
    live: "https://alivnavc.github.io/portfolio/index.html",
    github: "https://alivnavc.github.io/portfolio/index.html",
    get content() {
      return (
        <div>
          <TypographyP className="font-mono ">
            Neural Codex — interactive explainers that take transformers, neural nets, and the full LLM training stack apart layer by layer, with every number computed live.
          </TypographyP>
          <ProjectsLinks live={this.live} repo={this.github} />
          <SlideShow images={[`${BASE_PATH}/naveen/explain.png`]} />
        </div>
      );
    },
  },
];
export default projects;
