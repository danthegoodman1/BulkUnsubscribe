import pino from "pino"

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  messageKey: process.env.LOG_MSG_KEY || "msg",
  transport: {
    targets: [
      ...(process.env.AXIOM_ORG_ID &&
      process.env.AXIOM_TOKEN &&
      process.env.AXIOM_DATASET
        ? [
            {
              target: "pino-axiom",
              options: {
                orgId: process.env.AXIOM_ORG_ID,
                token: process.env.AXIOM_TOKEN,
                dataset: process.env.AXIOM_DATASET,
              },
              level: process.env.LOG_LEVEL || "info",
            },
          ]
        : []),
      process.env.PRETTY === "1"
        ? {
            target: "pino-pretty",
            options: { destination: 1 }, // this writes to STDOUT
            level: process.env.LOG_LEVEL || "info",
          }
        : {
            target: "pino/file",
            options: { destination: 1 }, // this writes to STDOUT
            level: process.env.LOG_LEVEL || "info",
          },
    ],
  },
})

if (
  process.env.AXIOM_ORG_ID &&
  process.env.AXIOM_TOKEN &&
  process.env.AXIOM_DATASET
) {
  logger.debug("using axiom transport")
}
