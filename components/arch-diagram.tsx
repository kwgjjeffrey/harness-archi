"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Data model ────────────────────────────────────────────────────────────────

type NodeId =
  // Harnessed Agent — Agent Middleware
  | "skill" | "filesystem" | "asset" | "memory"
  // Harnessed Agent — Agent Tools
  | "files" | "bash" | "asset-explorer" | "asset-executor"
  // Harnessed Agent — Backend
  | "sandbox" | "user-file-system"
  // Harnessed Agent — Resource
  | "db" | "api" | "wiki" | "card" | "skills-res"
  // Harness Agent — Observation
  | "tracing"
  // Harness Agent — Eval
  | "questions" | "experiments"
  // Harness Agent — Skills
  | "trace-analyzer" | "batch-eval" | "version"
  // Harness Agent — Tools
  | "asset-editor"

type GroupId =
  | "agent-middleware" | "agent-tools" | "backend" | "resource"
  | "observation" | "eval" | "skills-group" | "harness-tools"

interface Node {
  id: NodeId
  label: string
  sublabel?: string
  group: GroupId
}

interface Step {
  id: string
  type: "think" | "execute"
  label: string
  detail: string
  nodes: NodeId[]
  flows?: [NodeId, NodeId][]
}

interface StoryLine {
  id: string
  title: string
  scenario: string
  category: "harnessed" | "harness"
  steps: Step[]
}

const NODES: Node[] = [
  // ── Harnessed Agent ──
  { id: "skill",            label: "Skill",           group: "agent-middleware" },
  { id: "filesystem",       label: "Filesystem",      group: "agent-middleware" },
  { id: "asset",            label: "Asset",           group: "agent-middleware" },
  { id: "memory",           label: "Memory",          group: "agent-middleware" },
  { id: "files",            label: "Files",           sublabel: "write, edit, read\nls, grep", group: "agent-tools" },
  { id: "bash",             label: "Bash",            group: "agent-tools" },
  { id: "asset-explorer",   label: "Asset Explorer",  sublabel: "list, search, view", group: "agent-tools" },
  { id: "asset-executor",   label: "Asset Executor",  sublabel: "execute_sql,\ncall_a_function,\ncall_a_card", group: "agent-tools" },
  { id: "sandbox",          label: "Sandbox",         group: "backend" },
  { id: "user-file-system", label: "User File System",group: "backend" },
  { id: "db",               label: "DB",              group: "resource" },
  { id: "api",              label: "API",             group: "resource" },
  { id: "wiki",             label: "WIKI",            group: "resource" },
  { id: "card",             label: "CARD",            group: "resource" },
  { id: "skills-res",       label: "SKILLS",          group: "resource" },
  // ── Harness Agent ──
  { id: "tracing",          label: "Tracing",         group: "observation" },
  { id: "questions",        label: "Questions",       group: "eval" },
  { id: "experiments",      label: "Experiments",     group: "eval" },
  { id: "trace-analyzer",   label: "Trace Analyzer",  group: "skills-group" },
  { id: "batch-eval",       label: "Batch Eval",      sublabel: "批量调用, 拉取 tracing,\nLLM as Judge", group: "skills-group" },
  { id: "version",          label: "Version",         group: "skills-group" },
  { id: "asset-editor",     label: "Asset Editor",    sublabel: "edit middleware,\ntools, resources", group: "harness-tools" },
]

const NODE_RELATIONS: Record<NodeId, NodeId[]> = {
  skill:              ["files", "bash"],
  filesystem:         ["files", "bash", "sandbox", "user-file-system"],
  asset:              ["asset-explorer", "asset-executor"],
  memory:             [],
  files:              ["skill", "filesystem", "sandbox", "user-file-system"],
  bash:               ["skill", "filesystem", "sandbox", "user-file-system"],
  "asset-explorer":   ["asset", "db", "api", "wiki", "card", "skills-res"],
  "asset-executor":   ["asset", "db", "api", "card"],
  sandbox:            ["files", "bash", "filesystem"],
  "user-file-system": ["files", "bash", "filesystem"],
  db:                 ["asset-explorer", "asset-executor"],
  api:                ["asset-explorer", "asset-executor"],
  wiki:               ["asset-explorer"],
  card:               ["asset-explorer", "asset-executor"],
  "skills-res":       ["asset-explorer"],
  tracing:            ["trace-analyzer"],
  questions:          ["experiments", "batch-eval"],
  experiments:        ["questions", "batch-eval", "version"],
  "trace-analyzer":   ["tracing", "batch-eval"],
  "batch-eval":       ["trace-analyzer", "questions", "experiments"],
  version:            ["experiments"],
  "asset-editor":     ["asset", "skill", "db", "wiki", "card", "skills-res"],
}

// ─── Story Lines ──────────────────────────────────────────────────────────────

const STORY_LINES: StoryLine[] = [
  // ══════ Harnessed Agent 场景 ══════
  {
    id: "story-query",
    title: "数据查询",
    scenario: "「我要看下上个月的在职人数」",
    category: "harnessed",
    steps: [
      {
        id: "s1-think1",
        type: "think",
        label: "了解可用数据资产",
        detail: "用户问的是在职人数，这是个明确的指标查询。先看看有哪些数据资产能覆盖这个问题。",
        nodes: [],
      },
      {
        id: "s1-exec1",
        type: "execute",
        label: "Asset Explorer.search('在职人数')",
        detail: "调用 Asset Explorer 的 search 工具，搜索与「在职人数」相关的数据资产。",
        nodes: ["asset-explorer", "db", "api", "card"],
        flows: [["asset-explorer", "db"], ["asset-explorer", "api"], ["asset-explorer", "card"]],
      },
      {
        id: "s1-think2",
        type: "think",
        label: "选择最合适的资产",
        detail: "搜索结果中 DB、API、CARD 都能解决问题。CARD 是预制的可视化卡片，直接展示在职趋势，最贴合用户提问，体验也最友好。",
        nodes: [],
      },
      {
        id: "s1-exec2",
        type: "execute",
        label: "Asset Executor.call_a_card('在职人数趋势')",
        detail: "通过 Asset Executor 调用 call_a_card，渲染在职人数 CARD，直接返回给用户。",
        nodes: ["asset-executor", "card"],
        flows: [["asset-executor", "card"]],
      },
    ],
  },
  {
    id: "story-analysis",
    title: "数据分析",
    scenario: "「我想分析下绩效公平性，想看看一些关键维度与绩效好坏的相关性」",
    category: "harnessed",
    steps: [
      {
        id: "s2-think1",
        type: "think",
        label: "判断资产类型",
        detail: "绩效公平性是探索型分析需求，维度组合灵活，CARD 预制资产几乎不可能提前覆盖。需要直接查 DB 原始数据自行分析。",
        nodes: [],
      },
      {
        id: "s2-exec1",
        type: "execute",
        label: "Asset Explorer.search('绩效')",
        detail: "调用 Asset Explorer 搜索绩效相关数据资产，确认 DB 中存在员工绩效评分表及关键维度字段（部门、司龄、职级等）。",
        nodes: ["asset-explorer", "db"],
        flows: [["asset", "asset-explorer"], ["asset-explorer", "db"]],
      },
      {
        id: "s2-think2",
        type: "think",
        label: "制定分析策略",
        detail: "找到绩效宽表，包含绩效等级、部门、司龄、职级等字段。计划：写一个 Python 脚本调用 execute_sql 拉数据，再做 Spearman 相关性分析，直接在 Sandbox 中运行。",
        nodes: [],
      },
      {
        id: "s2-exec2",
        type: "execute",
        label: "Files.write(analyze.py, execute_afterwards=true)",
        detail: "用 Files 工具将分析脚本写入 Sandbox，脚本内调用 execute_sql util 查询绩效宽表。参数 execute_afterwards=true，写完立即在 Sandbox 中执行。",
        nodes: ["filesystem", "files", "sandbox"],
        flows: [["filesystem", "files"], ["files", "sandbox"]],
      },
      {
        id: "s2-exec3",
        type: "execute",
        label: "Sandbox 执行：execute_sql 查绩效宽表",
        detail: "Sandbox 内脚本运行，execute_sql util 向 DB 发起查询，结果打印到终端标准输出，Agent 直接读取。",
        nodes: ["sandbox", "db"],
        flows: [["sandbox", "db"]],
      },
      {
        id: "s2-exec4",
        type: "execute",
        label: "Files.edit(analyze.py, execute_afterwards=true)",
        detail: "Agent 读取终端输出后，用 Files.edit 追加相关性计算逻辑（pandas + scipy Spearman），再次带 execute_afterwards=true 执行，终端打印各维度相关系数。",
        nodes: ["filesystem", "files", "sandbox"],
        flows: [["filesystem", "files"], ["files", "sandbox"]],
      },
      {
        id: "s2-exec5",
        type: "execute",
        label: "Files.write(report.md)",
        detail: "分析完成，用 Files.write 将相关性结论和建议写入 User File System，生成可读报告返回给用户。",
        nodes: ["filesystem", "files", "user-file-system"],
        flows: [["filesystem", "files"], ["files", "user-file-system"]],
      },
    ],
  },
  {
    id: "story-research",
    title: "行业研究",
    scenario: "「结合内部财务数据和外部上市公司数据，对比公司经营指标在行业中的水平」",
    category: "harnessed",
    steps: [
      {
        id: "s3-think1",
        type: "think",
        label: "拆解数据来源",
        detail: "需要两类数据：公司内部财务数据（收入、利润率、人效等）来自内部 DB；外部上市公司数据需要通过 API 获取公开财报。",
        nodes: [],
      },
      {
        id: "s3-exec1",
        type: "execute",
        label: "Asset Explorer.search('财务指标')",
        detail: "搜索内部数据资产，找到公司财务指标宽表（DB）和外部上市公司财报 API。",
        nodes: ["asset-explorer", "db", "api"],
        flows: [["asset", "asset-explorer"], ["asset-explorer", "db"], ["asset-explorer", "api"]],
      },
      {
        id: "s3-exec2",
        type: "execute",
        label: "Files.write(research.py, execute_afterwards=true)",
        detail: "写入行业研究脚本：先通过 execute_sql 拉取内部财务数据，再通过 call_api 获取同行业上市公司财报数据。",
        nodes: ["filesystem", "files", "sandbox"],
        flows: [["filesystem", "files"], ["files", "sandbox"]],
      },
      {
        id: "s3-exec3",
        type: "execute",
        label: "Sandbox 执行：拉取内外部数据",
        detail: "Sandbox 中脚本运行，execute_sql 查内部 DB、call_api 调外部财报 API，两份数据打印到终端供 Agent 读取。",
        nodes: ["sandbox", "db", "api"],
        flows: [["sandbox", "db"], ["sandbox", "api"]],
      },
      {
        id: "s3-exec4",
        type: "execute",
        label: "Files.edit(research.py, execute_afterwards=true)",
        detail: "追加对比分析逻辑：计算公司各指标的行业百分位排名，生成对比表格和雷达图数据，终端输出分析结果。",
        nodes: ["filesystem", "files", "sandbox"],
        flows: [["filesystem", "files"], ["files", "sandbox"]],
      },
      {
        id: "s3-exec5",
        type: "execute",
        label: "Files.write(industry_report.md)",
        detail: "将行业对比报告写入 User File System，包含各指标排名、优劣势分析和建议。",
        nodes: ["filesystem", "files", "user-file-system"],
        flows: [["filesystem", "files"], ["files", "user-file-system"]],
      },
    ],
  },
  {
    id: "story-reimbursement",
    title: "业务办理",
    scenario: "「需要做报销，将本地发票按要求上传并提交」",
    category: "harnessed",
    steps: [
      {
        id: "s4-think1",
        type: "think",
        label: "了解报销流程",
        detail: "用户要提交报销，需要先找到报销提交的 API 接口，了解发票上传的格式要求和字段规范。",
        nodes: [],
      },
      {
        id: "s4-exec1",
        type: "execute",
        label: "Asset Explorer.search('报销 发票提交')",
        detail: "搜索报销相关资产，找到发票提交 API，了解上传接口的参数要求（文件格式、必填字段等）。",
        nodes: ["asset-explorer", "api"],
        flows: [["asset", "asset-explorer"], ["asset-explorer", "api"]],
      },
      {
        id: "s4-exec2",
        type: "execute",
        label: "Files.read(本地发票文件)",
        detail: "通过 Files 工具读取用户本地的发票文件，获取发票图片或 PDF 内容。",
        nodes: ["filesystem", "files", "user-file-system"],
        flows: [["filesystem", "files"], ["files", "user-file-system"]],
      },
      {
        id: "s4-think2",
        type: "think",
        label: "校验发票信息",
        detail: "检查发票内容是否符合提交要求：格式是否正确、金额是否清晰、日期是否在有效期内。如有问题提前告知用户。",
        nodes: [],
      },
      {
        id: "s4-exec3",
        type: "execute",
        label: "Asset Executor.call_a_function('提交报销')",
        detail: "通过 Asset Executor 调用报销提交 API，从 User File System 读取发票文件，按接口要求上传并提交。",
        nodes: ["asset-executor", "api", "user-file-system"],
        flows: [["user-file-system", "asset-executor"], ["asset-executor", "api"]],
      },
    ],
  },
  {
    id: "story-consultation",
    title: "内容咨询",
    scenario: "「要跟员工谈离职，需要做一下方案准备」",
    category: "harnessed",
    steps: [
      {
        id: "s5-think1",
        type: "think",
        label: "识别信息需求",
        detail: "离职面谈方案涉及多种数据源：WIKI 中的离职政策、SKILLS 中的面谈方案模板、DB 中的员工数据。先搜索可用资产。",
        nodes: [],
      },
      {
        id: "s5-exec1",
        type: "execute",
        label: "Asset Explorer.search('离职')",
        detail: "搜索离职相关资产，找到 WIKI 离职政策文档、SKILLS 离职面谈 Skill、DB 员工信息表。",
        nodes: ["asset-explorer", "wiki", "db", "skills-res"],
        flows: [["asset", "asset-explorer"], ["asset-explorer", "wiki"], ["asset-explorer", "db"], ["asset-explorer", "skills-res"]],
      },
      {
        id: "s5-exec2",
        type: "execute",
        label: "Files.read(skill.md)",
        detail: "直接读取离职面谈 Skill 的内容。Skill 方案很具体：需要查询员工绩效、司龄等数据，结合离职知识库内容，按模板输出方案。",
        nodes: ["skill", "skills-res", "filesystem", "files"],
        flows: [["skill", "skills-res"], ["filesystem", "files"]],
      },
      {
        id: "s5-exec3",
        type: "execute",
        label: "Files.write(prepare.py, execute_afterwards=true)",
        detail: "按 Skill 指引，写脚本通过 execute_sql 查询 DB 中该员工的入职时间、部门、职级、绩效等数据，同时拉取公开离职知识库内容。",
        nodes: ["filesystem", "files", "sandbox", "db", "wiki"],
        flows: [["filesystem", "files"], ["files", "sandbox"], ["sandbox", "db"], ["sandbox", "wiki"]],
      },
      {
        id: "s5-exec4",
        type: "execute",
        label: "Files.write(离职面谈方案.md)",
        detail: "综合 Skill 模板、员工数据和离职知识库内容，生成结构化面谈方案：开场策略、关键话术、补偿方案参考、风险预案、后续跟进计划。",
        nodes: ["filesystem", "files", "user-file-system"],
        flows: [["filesystem", "files"], ["files", "user-file-system"]],
      },
    ],
  },

  // ══════ Harness Agent 场景 ══════
  {
    id: "story-batch-eval",
    title: "批量评测",
    scenario: "「看下当前 Agent 在这个问题集上的准确率，分析效果并改进」",
    category: "harness",
    steps: [
      {
        id: "s6-think1",
        type: "think",
        label: "明确评测目标",
        detail: "需要在指定问题集上批量评测 Harnessed Agent 的表现。Batch Eval Skill 里有完整的评测流程：批量调用被评测 Agent、拉取 Tracing 记录、LLM as Judge 打分。",
        nodes: [],
      },
      {
        id: "s6-exec1",
        type: "execute",
        label: "Files.read(batch-eval/skill.md)",
        detail: "读取 Batch Eval Skill 内容，了解评测流程：1) 批量调用脚本 2) Tracing 拉取脚本 3) LLM as Judge 评分脚本。",
        nodes: ["batch-eval", "skills-res", "filesystem", "files"],
        flows: [["batch-eval", "skills-res"], ["filesystem", "files"]],
      },
      {
        id: "s6-exec2",
        type: "execute",
        label: "Files.write(run_eval.py, execute_afterwards=true)",
        detail: "按 Skill 指引写批量评测脚本：从 Questions 加载问题集，逐条调用 Harnessed Agent，拉取每条的 Tracing 记录。",
        nodes: ["filesystem", "files", "sandbox", "questions", "tracing"],
        flows: [["filesystem", "files"], ["files", "sandbox"], ["sandbox", "questions"], ["sandbox", "tracing"]],
      },
      {
        id: "s6-exec3",
        type: "execute",
        label: "Files.edit(run_eval.py, execute_afterwards=true)",
        detail: "追加 LLM as Judge 评分逻辑，对每条 Tracing 进行准确率判定，终端打印整体准确率和各题得分明细。",
        nodes: ["filesystem", "files", "sandbox"],
        flows: [["filesystem", "files"], ["files", "sandbox"]],
      },
      {
        id: "s6-think2",
        type: "think",
        label: "Bad Case 归因",
        detail: "读取评测结果，识别 bad case 模式：是 Asset 搜索不到正确资产？还是 SQL 生成错误？还是 Skill 指引不够具体？逐个归因。",
        nodes: [],
      },
      {
        id: "s6-exec4",
        type: "execute",
        label: "Files.write(improvement_plan.md)",
        detail: "输出改进计划：列出每类 bad case 的根因、影响面和修复方案。",
        nodes: ["filesystem", "files", "user-file-system"],
        flows: [["filesystem", "files"], ["files", "user-file-system"]],
      },
      {
        id: "s6-exec5",
        type: "execute",
        label: "Asset Editor：修改 Harnessed Agent 配置",
        detail: "根据改进计划，通过 Asset Editor 直接修改 Harnessed Agent 的各层：更新 Asset 元数据让搜索更准、修改 Skill 指引让推理更可靠、调整 CARD 模板补全缺失场景。",
        nodes: ["asset-editor", "asset", "skill", "skills-res", "card"],
        flows: [["asset-editor", "asset"], ["asset-editor", "skill"], ["asset-editor", "skills-res"], ["asset-editor", "card"]],
      },
      {
        id: "s6-exec6",
        type: "execute",
        label: "Experiments.record(版本记录)",
        detail: "将本轮评测结果和改进内容记录到 Experiments，生成新 Version，便于后续对比回归。",
        nodes: ["experiments", "version"],
        flows: [["experiments", "version"]],
      },
    ],
  },
  {
    id: "story-tracing-analysis",
    title: "线上 Tracing 分析",
    scenario: "「分析线上真实对话的 Tracing 数据，找出问题并改进 Agent」",
    category: "harness",
    steps: [
      {
        id: "s7-think1",
        type: "think",
        label: "明确分析目标",
        detail: "需要拉取线上真实用户对话的 Tracing 数据，分析 Harnessed Agent 在生产环境中的实际表现，找出系统性问题。Trace Analyzer Skill 里有分析流程。",
        nodes: [],
      },
      {
        id: "s7-exec1",
        type: "execute",
        label: "Files.read(trace-analyzer/skill.md)",
        detail: "读取 Trace Analyzer Skill 内容，了解分析流程：如何拉取线上 Tracing、如何分类统计、如何识别异常模式。",
        nodes: ["trace-analyzer", "skills-res", "filesystem", "files"],
        flows: [["trace-analyzer", "skills-res"], ["filesystem", "files"]],
      },
      {
        id: "s7-exec2",
        type: "execute",
        label: "Files.write(fetch_traces.py, execute_afterwards=true)",
        detail: "按 Skill 指引写脚本，从 Tracing 系统拉取最近一段时间的线上对话记录，包含完整的工具调用链和结果。",
        nodes: ["filesystem", "files", "sandbox", "tracing"],
        flows: [["filesystem", "files"], ["files", "sandbox"], ["sandbox", "tracing"]],
      },
      {
        id: "s7-exec3",
        type: "execute",
        label: "Files.edit(fetch_traces.py, execute_afterwards=true)",
        detail: "追加分析逻辑：按场景分类、统计成功/失败率、识别高频失败模式（如搜索无结果、SQL 报错、API 超时等），终端打印分析报告。",
        nodes: ["filesystem", "files", "sandbox"],
        flows: [["filesystem", "files"], ["files", "sandbox"]],
      },
      {
        id: "s7-think2",
        type: "think",
        label: "问题归因与改进方案",
        detail: "从分析结果中提炼系统性问题：哪些是 Asset 元数据不完整导致搜索失败？哪些是 Skill 覆盖不足？哪些是资源配置问题？制定针对性改进方案。",
        nodes: [],
      },
      {
        id: "s7-exec4",
        type: "execute",
        label: "Asset Editor：修改 Harnessed Agent 各层",
        detail: "根据归因结果，通过 Asset Editor 修改 Harnessed Agent：补充 Asset 描述和标签、新增/修改 Skill 模板、更新 WIKI 内容、调整 DB 查询模板。",
        nodes: ["asset-editor", "asset", "skill", "wiki", "db", "skills-res"],
        flows: [["asset-editor", "asset"], ["asset-editor", "skill"], ["asset-editor", "wiki"], ["asset-editor", "db"], ["asset-editor", "skills-res"]],
      },
      {
        id: "s7-exec5",
        type: "execute",
        label: "Experiments.record(改进版本)",
        detail: "记录本轮分析结论和所有修改内容到 Experiments，生成新 Version 用于后续回归对比。",
        nodes: ["experiments", "version"],
        flows: [["experiments", "version"]],
      },
    ],
  },
]

// ─── Highlight computation ────────────────────────────────────────────────────

type HighlightLevel = "selected" | "level1" | "level2" | "story" | "dimmed" | "none"

function computeHighlights(
  selectedNode: NodeId | null,
  activeStep: Step | null,
): Map<NodeId, HighlightLevel> {
  const map = new Map<NodeId, HighlightLevel>()

  if (activeStep) {
    const stepNodes = new Set(activeStep.nodes)
    NODES.forEach((n) => {
      map.set(n.id, stepNodes.has(n.id) ? "story" : "dimmed")
    })
    return map
  }

  if (!selectedNode) {
    NODES.forEach((n) => map.set(n.id, "none"))
    return map
  }

  const level1 = new Set(NODE_RELATIONS[selectedNode] ?? [])
  const level2 = new Set<NodeId>()
  level1.forEach((neighbor) => {
    NODE_RELATIONS[neighbor]?.forEach((n) => {
      if (n !== selectedNode && !level1.has(n)) level2.add(n)
    })
  })

  NODES.forEach((n) => {
    if (n.id === selectedNode) map.set(n.id, "selected")
    else if (level1.has(n.id)) map.set(n.id, "level1")
    else if (level2.has(n.id)) map.set(n.id, "level2")
    else map.set(n.id, "dimmed")
  })

  return map
}

// ─── Block ────────────────────────────────────────────────────────────────────

function Block({
  node,
  level,
  onClick,
}: {
  node: Node
  level: HighlightLevel
  onClick: (id: NodeId) => void
}) {
  return (
    <button
      onClick={() => onClick(node.id)}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 cursor-pointer select-none min-w-[100px]",
        level === "selected" && "border-blue-500 bg-blue-50 shadow-lg shadow-blue-200 scale-105",
        level === "level1"   && "border-blue-400 bg-blue-50/70 shadow-md shadow-blue-100",
        level === "level2"   && "border-amber-300 bg-amber-50/60 shadow-sm shadow-amber-100",
        level === "story"    && "border-violet-400 bg-violet-50/70 shadow-md shadow-violet-100",
        level === "dimmed"   && "border-border/30 bg-background/30 opacity-25",
        level === "none"     && "border-border bg-background hover:border-blue-300 hover:shadow-sm",
      )}
    >
      <span className={cn(
        "text-sm font-bold leading-tight",
        level === "selected" && "text-blue-700",
        level === "level1"   && "text-blue-600",
        level === "level2"   && "text-amber-600",
        level === "story"    && "text-violet-700",
        (level === "dimmed" || level === "none") && "text-foreground",
      )}>
        {node.label}
      </span>
      {node.sublabel && (
        <span className="mt-0.5 whitespace-pre-line text-[10px] leading-tight text-muted-foreground">
          {node.sublabel}
        </span>
      )}
    </button>
  )
}

// ─── GroupBox ─────────────────────────────────────────────────────────────────

function GroupBox({
  title,
  isActive,
  children,
  className,
  accent,
}: {
  title: string
  isActive: boolean
  children: React.ReactNode
  className?: string
  accent?: "blue" | "emerald"
}) {
  const c = accent === "emerald" ? {
    border: "border-emerald-400",
    headerBorder: "border-emerald-200",
    headerBg: "bg-emerald-50/50",
    headerText: "text-emerald-700",
  } : {
    border: "border-blue-400",
    headerBorder: "border-blue-200",
    headerBg: "bg-blue-50/50",
    headerText: "text-blue-700",
  }

  return (
    <div className={cn(
      "rounded-lg border-2 transition-all duration-200",
      isActive ? `${c.border} shadow-md` : "border-border",
    )}>
      <div className={cn(
        "flex items-center gap-1 border-b px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors",
        isActive ? `${c.headerBorder} ${c.headerBg} ${c.headerText}` : "border-border text-muted-foreground",
      )}>
        <span className="size-2 rounded-sm border border-current opacity-70" />
        {title}
      </div>
      <div className={cn("flex flex-wrap gap-3 p-3", className)}>
        {children}
      </div>
    </div>
  )
}

// ─── StepCard ─────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  isActive,
  onClick,
}: {
  step: Step
  index: number
  isActive: boolean
  onClick: () => void
}) {
  const isThink = step.type === "think"
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 w-full",
        isActive
          ? isThink
            ? "border-amber-400 bg-amber-50 shadow-sm"
            : "border-violet-400 bg-violet-50 shadow-sm"
          : "border-border bg-background hover:border-muted-foreground/30",
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
        <span className={cn(
          "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
          isActive
            ? isThink ? "bg-amber-400 text-white" : "bg-violet-500 text-white"
            : "bg-muted text-muted-foreground",
        )}>
          {index + 1}
        </span>
        <span className={cn(
          "rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide",
          isThink ? "bg-amber-100 text-amber-600" : "bg-violet-100 text-violet-600",
        )}>
          {isThink ? "思考" : "执行"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-xs font-semibold font-mono leading-tight",
          isActive ? (isThink ? "text-amber-700" : "text-violet-700") : "text-foreground",
        )}>
          {step.label}
        </p>
        {isActive && (
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
        )}
        {isActive && step.flows && step.flows.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {step.flows.map(([a, b], i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                  {NODES.find((n) => n.id === a)?.label}
                </span>
                <span className="text-[10px] text-violet-400">→</span>
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                  {NODES.find((n) => n.id === b)?.label}
                </span>
                {i < (step.flows?.length ?? 0) - 1 && <span className="text-muted-foreground/30 text-[10px]">·</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ArchDiagram() {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null)
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)

  const selectedStory = STORY_LINES.find((s) => s.id === selectedStoryId) ?? null
  const activeStep = selectedStory?.steps.find((s) => s.id === activeStepId) ?? null

  const highlights = computeHighlights(selectedNode, activeStep)
  const anyActive = selectedNode !== null || activeStep !== null

  const handleNodeClick = (id: NodeId) => {
    setSelectedStoryId(null)
    setActiveStepId(null)
    setSelectedNode((prev) => (prev === id ? null : id))
  }

  const handleStorySelect = (storyId: string) => {
    if (selectedStoryId === storyId) {
      setSelectedStoryId(null)
      setActiveStepId(null)
      setSelectedNode(null)
    } else {
      setSelectedStoryId(storyId)
      setActiveStepId(null)
      setSelectedNode(null)
    }
  }

  const handleStepClick = (stepId: string) => {
    setSelectedNode(null)
    setActiveStepId((prev) => (prev === stepId ? null : stepId))
  }

  const groupActive = (group: GroupId) =>
    anyActive &&
    NODES.filter((n) => n.group === group).some((n) => {
      const lv = highlights.get(n.id)
      return lv === "selected" || lv === "level1" || lv === "level2" || lv === "story"
    })

  const nodesOf = (group: GroupId) => NODES.filter((n) => n.group === group)

  const harnessedStories = STORY_LINES.filter((s) => s.category === "harnessed")
  const harnessStories = STORY_LINES.filter((s) => s.category === "harness")

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f0] font-sans">
      {/* Header */}
      <div className="border-b bg-background px-6 py-3">
        <h1 className="text-base font-semibold text-foreground">Agent Architecture</h1>
        <p className="text-xs text-muted-foreground">点击模块查看关联 · 选择故事线逐步查看数据流</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-b bg-background/80 px-6 py-2">
        <span className="text-[11px] text-muted-foreground font-medium">图例</span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-blue-500 bg-blue-50" />
          <span className="text-[11px] text-blue-700">选中</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-blue-400 bg-blue-50/70" />
          <span className="text-[11px] text-blue-600">直接关联</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-amber-300 bg-amber-50/60" />
          <span className="text-[11px] text-amber-600">二级关联</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-violet-400 bg-violet-50/70" />
          <span className="text-[11px] text-violet-600">故事步骤</span>
        </span>
        <span className="mx-2 h-3 border-l" />
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-border bg-background" />
          <span className="text-[11px] text-muted-foreground">Harnessed Agent</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-emerald-400 bg-emerald-50/50" />
          <span className="text-[11px] text-emerald-600">Harness Agent</span>
        </span>
      </div>

      {/* Body: diagram left, story panel right */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: architecture diagram */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-6">
          {/* ── Harnessed Agent section ── */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Harnessed Agent</p>
          <GroupBox title="Agent Middleware" isActive={groupActive("agent-middleware")}>
            {nodesOf("agent-middleware").map((n) => (
              <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
            ))}
          </GroupBox>
          <GroupBox title="Agent Tools" isActive={groupActive("agent-tools")}>
            {nodesOf("agent-tools").map((n) => (
              <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
            ))}
          </GroupBox>
          <GroupBox title="Backend" isActive={groupActive("backend")}>
            {nodesOf("backend").map((n) => (
              <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
            ))}
          </GroupBox>
          <GroupBox title="Resource" isActive={groupActive("resource")}>
            {nodesOf("resource").map((n) => (
              <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
            ))}
          </GroupBox>

          {/* ── Harness Agent section ── */}
          <div className="mt-2 border-t border-dashed border-emerald-300 pt-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Harness Agent</p>
            <div className="flex gap-4">
              <GroupBox title="Observation" isActive={groupActive("observation")} className="flex-row" accent="emerald">
                {nodesOf("observation").map((n) => (
                  <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
                ))}
              </GroupBox>
              <GroupBox title="Eval" isActive={groupActive("eval")} className="flex-row" accent="emerald">
                {nodesOf("eval").map((n) => (
                  <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
                ))}
              </GroupBox>
              <GroupBox title="Skills" isActive={groupActive("skills-group")} className="flex-row" accent="emerald">
                {nodesOf("skills-group").map((n) => (
                  <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
                ))}
              </GroupBox>
              <GroupBox title="Harness Tools" isActive={groupActive("harness-tools")} className="flex-row" accent="emerald">
                {nodesOf("harness-tools").map((n) => (
                  <Block key={n.id} node={n} level={highlights.get(n.id) ?? "none"} onClick={handleNodeClick} />
                ))}
              </GroupBox>
            </div>
          </div>
        </div>

        {/* Right: story panel */}
        <div className="w-[420px] shrink-0 overflow-auto border-l bg-background px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">故事线</p>

          {/* Harnessed Agent stories */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Harnessed Agent 场景</p>
          <div className="flex flex-col gap-2 mb-4">
            {harnessedStories.map((story) => {
              const expanded = selectedStoryId === story.id
              return (
                <div
                  key={story.id}
                  className={cn(
                    "rounded-lg border-2 transition-all duration-200",
                    expanded ? "border-violet-400 shadow-sm" : "border-border",
                  )}
                >
                  <button
                    onClick={() => handleStorySelect(story.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors rounded-lg",
                      expanded ? "bg-violet-50" : "bg-background hover:bg-muted/30",
                    )}
                  >
                    <span className={cn(
                      "shrink-0 text-[10px] transition-transform duration-200 text-muted-foreground",
                      expanded ? "rotate-90" : "rotate-0",
                    )}>▶</span>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-semibold", expanded ? "text-violet-700" : "text-foreground")}>
                        {story.title}
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground truncate">{story.scenario}</p>
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-violet-100 px-3 py-2 flex flex-col gap-1.5">
                      {story.steps.map((step, i) => (
                        <StepCard
                          key={step.id}
                          step={step}
                          index={i}
                          isActive={activeStepId === step.id}
                          onClick={() => handleStepClick(step.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Harness Agent stories */}
          <div className="border-t border-dashed border-emerald-300 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Harness Agent 场景</p>
            <div className="flex flex-col gap-2">
              {harnessStories.map((story) => {
                const expanded = selectedStoryId === story.id
                return (
                  <div
                    key={story.id}
                    className={cn(
                      "rounded-lg border-2 transition-all duration-200",
                      expanded ? "border-emerald-400 shadow-sm" : "border-border",
                    )}
                  >
                    <button
                      onClick={() => handleStorySelect(story.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors rounded-lg",
                        expanded ? "bg-emerald-50" : "bg-background hover:bg-muted/30",
                      )}
                    >
                      <span className={cn(
                        "shrink-0 text-[10px] transition-transform duration-200 text-muted-foreground",
                        expanded ? "rotate-90" : "rotate-0",
                      )}>▶</span>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold", expanded ? "text-emerald-700" : "text-foreground")}>
                          {story.title}
                        </p>
                        <p className="text-[11px] leading-snug text-muted-foreground truncate">{story.scenario}</p>
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-emerald-100 px-3 py-2 flex flex-col gap-1.5">
                        {story.steps.map((step, i) => (
                          <StepCard
                            key={step.id}
                            step={step}
                            index={i}
                            isActive={activeStepId === step.id}
                            onClick={() => handleStepClick(step.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
