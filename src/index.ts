import * as dotenv from "dotenv"
dotenv.config()

import express from "express"
import { v4 as uuidv4 } from "uuid"
import cors from "cors"

import { logger } from "./logger/index"
import { createRequestHandler } from "@remix-run/express"
import { broadcastDevReady } from "@remix-run/node"

import sourceMapSupport from "source-map-support"
sourceMapSupport.install()

import * as build from "../build/index.js"

const listenPort = process.env.PORT || "8080"

declare global {
  namespace Express {
    interface Request {
      id: string
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      DB_FILENAME?: string
      ADMIN_EMAILS?: string
      AWS_DEFAULT_REGION?: string
      AWS_ACCESS_KEY_ID?: string
      AWS_SECRET_ACCESS_KEY?: string
      S3_BUCKET: string
      S3_ENDPOINT: string
      POSTMARK_TOKEN: string
      MY_URL: string
    }
  }
}

async function main() {
  const app = express()
  app.use(express.json())
  app.disable("x-powered-by")
  app.use(cors())

  // Remix public
  app.use(express.static("public"))
  app.use(express.static("src/public"))

  app.use((req, res, next) => {
    const reqID = uuidv4()
    req.id = reqID
    next()
  })

  if (process.env.HTTP_LOG === "1") {
    logger.debug("using HTTP logger")
    app.use((req: any, res, next) => {
      req.log.info({ req })
      res.on("finish", () => req.log.info({ res }))
      next()
    })
  }

  app.get("/hc", (req, res) => {
    res.sendStatus(200)
  })

  // Everything else we send to the frontend
  app.all("*", createRequestHandler({ build: build as any }))

  const server = app.listen(listenPort, () => {
    if (process.env.NODE_ENV === "development") {
      broadcastDevReady(build as any)
    }
    logger.info(`API listening on port ${listenPort}`)
  })

  const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
  }

  let stopping = false
  Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
      if (stopping) {
        return
      }
      stopping = true
      logger.info(`Received signal ${signal}, shutting down...`)
      logger.info("exiting...")
      logger.flush() // pino actually fails to flush, even with awaiting on a callback
      server.close()
      process.exit(0)
    })
  })
}

main()
