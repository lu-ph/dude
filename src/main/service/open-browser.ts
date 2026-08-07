import { exec } from "node:child_process"

type Position = [x: number, y: number]
type Size = [width: number, height: number]

export function openBrowser(url: string, position?: Position, size?: Size): void {
  const flags: string[] = [`--app="${url}"`]

  if (position) {
    const [x, y] = position
    flags.push(`--window-position=${x},${y}`)
  }

  if (size) {
    const [width, height] = size
    flags.push(`--window-size=${width},${height}`)
  }

  const flagStr = flags.join(" ")
  const cmd =
    process.platform === "win32"
      ? `start chrome ${flagStr} || start msedge ${flagStr}`
      : `open -n -a "Google Chrome" --args ${flagStr}`

  exec(cmd)
}
