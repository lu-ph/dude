const TOOL_NAME_MAP: Record<string, string> = {
  capture_screen: "截取屏幕",
  previous_page: "跳转到上一页",
  next_page: "跳转至下一页",
  jump_to_page: "跳转页面",
  open_pdf_viewer: "打开PDF",
  Read: "读取文件",
  Edit: "编辑文件",
  Write: "写入文件",
  Bash: "执行命令",
  Glob: "查找文件",
  Grep: "搜索内容",
  Task: "委派任务",
  TaskOutput: "查看任务输出",
  KillShell: "终止命令",
  NotebookEdit: "编辑笔记本",
  WebFetch: "获取网页",
  WebSearch: "搜索网页",
  TodoWrite: "更新任务清单",
  AskUserQuestion: "询问用户",
  EnterPlanMode: "进入计划模式",
  ExitPlanMode: "退出计划模式",
  Skill: "调用技能",
  Computer: "操作电脑",
}

export function getToolDisplayName(toolName: string): string {
  const directName = TOOL_NAME_MAP[toolName]
  if (directName) return directName

  const shortName = toolName.split("__").pop()
  return (shortName && TOOL_NAME_MAP[shortName]) || toolName
}
