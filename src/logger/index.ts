import { pino } from "pino"

export const logger = pino(
  process.env.PRETTY === "1"
    ? {
        transport: {
          target: "pino-pretty",
        },
        level: process.env.LOG_LEVEL || "debug",
      }
    : {
        level: process.env.LOG_LEVEL || "info",
        formatters: {
          level: (label) => {
            return {
              [process.env.LOG_LEVEL_KEY || "level"]: label,
            }
          },
        },
        messageKey: process.env.LOG_MSG_KEY || "message",
      }
)
