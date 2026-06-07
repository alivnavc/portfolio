"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
// @ts-ignore
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css/core";

import "@splidejs/react-splide/css";

const PROJECTS = [
  {
    id: 1,
    name: "AI Multi-Agent Investment Strategist",
    description: `A multi-agent system that researches markets and assembles investment strategies — specialised agents coordinate analysis, risk, and recommendations.`,
    link: "https://github.com/alivnavc/AI-Multi-Agent-Investment-Strategist",
    images: ["/assets/projects-screenshots/naveen/invest.png"],
  },
  {
    id: 2,
    name: "Multi-Agent Travel Assistant (custom MCP)",
    description: `A travel-planning assistant built on a from-scratch Model Context Protocol server, with collaborating agents for search, itinerary and booking flows.`,
    link: "https://github.com/alivnavc/Gen-AI-Travel-Agent",
    images: ["/assets/projects-screenshots/naveen/travel.png"],
  },
  {
    id: 3,
    name: "Autonomous Pentest Agent — SQLi (RL/DPO)",
    description: `An autonomous multi-agent system for SQL-injection pentesting, trained with an RL / DPO-style preference loop to sharpen its exploit strategy.`,
    link: "https://github.com/alivnavc/autonomous-pentest-SQLi--agent",
    images: ["/assets/projects-screenshots/naveen/pentest.png"],
  },
  {
    id: 4,
    name: "Microsoft Teams Meetings MCP Server",
    description: `An MCP server to schedule, reschedule, cancel and manage Teams meetings via the Microsoft Graph API — open-source with 6.5k+ PyPI downloads.`,
    link: "https://github.com/alivnavc/Microsoft-Teams-Meetings-MCP-Server",
    images: ["/assets/projects-screenshots/naveen/teams.png"],
  },
  {
    id: 5,
    name: "Structured Synthetic Data with CTGAN",
    description: `Generates high-quality structured synthetic data with CTGAN, preserving column distributions and correlations for safe model training.`,
    link: "https://github.com/alivnavc/Synthetic-Data-Generation-CTGAN",
    images: ["/assets/projects-screenshots/naveen/ctgan.png"],
  },
  {
    id: 6,
    name: "AI Financial News Assistant (RAG)",
    description: `A retrieval-augmented, multi-agent assistant for financial news — instrumented with LangSmith tracing and RAGAS evaluation.`,
    link: "https://github.com/alivnavc/AI-Financial-News-Assistant-RAG",
    images: ["/assets/projects-screenshots/naveen/finrag.png"],
  },
  {
    id: 7,
    name: "Interactive Transformer & ML Explainers",
    description: `Neural Codex — interactive explainers that take transformers and the full LLM training stack apart layer by layer, with every number computed live.`,
    link: "https://alivnavc.github.io/portfolio/index.html",
    images: ["/assets/projects-screenshots/naveen/explain.png"],
  },
];
function Page() {
  return (
    <>
      <div className="container mx-auto md:px-[50px] xl:px-[150px] text-zinc-300 h-full">
        <h1 className="text-4xl mt-[100px] mb-[50px]">Projects</h1>
        <ul className="grid  md:grid-cols-2 lg:grid-cols-3 gap-10 place-content-around ">
          {PROJECTS.map((project) => (
            <li
              className="w-[300px] h-[400px] border-[.5px] rounded-md border-zinc-600"
              key={project.id}
              style={{ backdropFilter: "blur(2px)" }}
            >
              <div className="h-[200px]">
                <Splide
                  options={{
                    type: "loop",
                    interval: 3000,
                    autoplay: true,
                    speed: 2000,
                    perMove: 1,
                    rewind: true,
                    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                    arrows: false,
                  }}
                  aria-label="My Favorite Images"
                >
                  {project.images.map((image) => (
                    <SplideSlide key={image}>
                      <Image
                        src={image}
                        alt={`screenshot of "${project.name}`}
                        className="w-[300px] h-[200px] rounded-md bg-zinc-900 "
                        width={300}
                        height={400}
                        style={{ height: "200px" }}
                      />
                    </SplideSlide>
                  ))}
                </Splide>
              </div>
              <div className="p-4 text-zinc-300">
                <h2 className="text-xl">{project.name}</h2>
                <p className="mt-2 text-xs text-zinc-500">
                  {project.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Page;
