// import Stripe from "stripe"
// import { Response } from "express"
// import { RepoKind, selectRepo } from "src/db/repos"
// import { logger } from "src/logger"
// import { selectUser, selectUserBySubID, setUserPlan } from "src/db/users"
// import { extractError } from "src/utils"
// import {
//   ErrAlreadyShared,
//   shareDataset,
//   shareModel,
// } from "src/huggingface/huggingface"
// import { selectHFToken } from "src/db/hf_tokens"
// import { upsertSale } from "src/db/sales"
// import { PlanBusiness, PlanStandard } from "src/user/user"
// import { RowsNotFound } from "src/db/errors"
// import { KindBusinessUpgrade, KindRepoPurchase } from "./types"

// export interface CheckoutMetadata {
//   repo: string
//   buyerUserID: string
// }

// export async function handleStripeWebhook(
//   stripe: Stripe,
//   signature: string,
//   body: Buffer,
//   endpointSecret: string,
//   res: Response,
//   userID?: string
// ) {
//   let event: Stripe.Event
//   try {
//     event = await stripe.webhooks.constructEventAsync(
//       body,
//       signature,
//       endpointSecret
//     )
//   } catch (err) {
//     logger.debug({ err: extractError(err) }, "webhook error")
//     return res.status(400).send(`Webhook Error: ${(err as Error).message}`)
//   }

//   switch (event.type) {
//     case "checkout.session.completed":
//       logger.info(
//         { payload: event.data.object, eventType: event.type },
//         "got checkout session completed"
//       )
//       if (event.data.object.metadata?.kind === KindRepoPurchase) {
//         return handleStripeCheckoutCompleted(event, res, userID)
//       }
//       if (event.data.object.metadata?.kind === KindBusinessUpgrade) {
//         return handleBusinessUpgrade(event, res)
//       }
//       break

//     case "customer.subscription.created":
//       // logger.info(
//       //   { payload: event.data.object, eventType: event.type },
//       //   "got sub created"
//       // )
//       // if (
//       //   event.data.object.items.data.some(
//       //     (item) => item.plan.id === process.env.BUSINESS_SUB_PRICE_ID
//       //   )
//       // ) {
//       //   return handleBusinessUpgrade(event, res)
//       // }
//       break

//     case "customer.subscription.deleted":
//       // logger.info(
//       //   { payload: event.data.object, eventType: event.type },
//       //   "got sub deleted"
//       // )
//       await handleSubDeleted(event, res)

//     default:
//       break
//   }

//   // Otherwise unhandled, send 200
//   // logger.info(
//   //   { payload: event.data.object, eventType: event.type },
//   //   "unhandled stripe webhook"
//   // )
//   return res.sendStatus(200)
// }

// async function handleSubDeleted(
//   event: Stripe.CustomerSubscriptionDeletedEvent,
//   res: Response
// ) {
//   // Get the user for this sub
//   const user = await selectUserBySubID(event.data.object.id)
//   let errLogger = logger.child({ payload: event.data.object })
//   if (!user) {
//     errLogger.error("did not get user for subscription, aborting")
//     // send 200 so we don't get spammed with it, we can always replay event or cancel in dashboard
//     return res.sendStatus(200)
//   }
//   errLogger = errLogger.child({ user })

//   // Remove the subscription
//   if (
//     event.data.object.items.data.some(
//       (item) => item.price.id === process.env.BUSINESS_SUB_PRICE_ID
//     )
//   ) {
//     // Has the business plan, remove it
//     await setUserPlan(user.id, PlanStandard, undefined)
//     return res.sendStatus(200)
//   }

//   // Otherwise we have an issue
//   errLogger.error("did not find business plan on user, aborting")
//   return res.sendStatus(200)
// }

// async function handleBusinessUpgrade(
//   event: Stripe.CheckoutSessionCompletedEvent,
//   res: Response
// ) {
//   const metadata = event.data.object.metadata
//   const log = logger.child({ metadata })
//   log.debug("handling business upgrade")
//   if (!metadata) {
//     log.error({ event: event.data.object }, "missing metadata, aborting!")
//     return res.status(400).send("missing metadata")
//   }

//   const userID = metadata.userID
//   // Verify the user exists
//   try {
//     await selectUser(userID)
//   } catch (error) {
//     if (error instanceof RowsNotFound) {
//       log.error("user not found for business upgrade")
//       return res.status(404).send("user not found for business upgrade")
//     }
//     log.error(
//       {
//         err: extractError(error),
//         payload: event.data.object,
//       },
//       "error handling business upgrade"
//     )
//     return res.status(500).send("error handling business upgrade")
//   }
//   await setUserPlan(
//     userID,
//     PlanBusiness,
//     event.data.object.subscription?.toString()
//   )
// }

// async function handleStripeCheckoutCompleted(
//   event: Stripe.CheckoutSessionCompletedEvent,
//   res: Response,
//   userID?: string
// ) {
//   const metadata = event.data.object.metadata
//   if (!metadata) {
//     logger.error({ event: event.data.object }, "missing metadata, aborting!")
//     return res.status(400).send("missing metadata")
//   }

//   if (!event.data.object.amount_subtotal) {
//     logger.error({ event: event.data.object }, "missing subtotal, aborting!")
//     return res.status(400).send("missing subtotal")
//   }

//   const repo = await selectRepo(metadata.repo)
//   if (!repo) {
//     logger.error(
//       { event: event.data.object, metadata: metadata },
//       "did not find repo"
//     )
//     return res.status(404).send("did not find repo")
//   }
//   const buyer = await selectUser(metadata.buyerUserID)
//   const hfToken = await selectHFToken(repo.user_id)

//   // Give access
//   try {
//     switch (repo.kind as RepoKind) {
//       case "model":
//         await shareModel(hfToken, repo.id, buyer.username)
//         break
//       case "dataset":
//         await shareDataset(hfToken, repo.id, buyer.username)
//         break

//       default:
//         logger.error(
//           { event: event.data.object, metadata: metadata },
//           "unexpected repo kind"
//         )
//         return res.status(500).send("unexpected repo kinds")
//     }
//   } catch (error) {
//     if (error instanceof ErrAlreadyShared) {
//       logger.error(
//         { event: event.data.object, metadata: metadata },
//         "repo was already shared"
//       )
//     } else {
//       logger.error(
//         { err: extractError(error), metadata: metadata, repo: repo },
//         "error giving access to repo"
//       )
//       return res.status(500).send("error giving access to repo")
//     }
//   }

//   const ourTake = userID
//     ? 0
//     : Math.max(100, Math.round(event.data.object.amount_subtotal * 0.1))

//   // Upsert payment
//   await upsertSale(
//     event.data.object.payment_intent?.toString() ?? event.id,
//     buyer.id,
//     repo.user_id,
//     repo.id,
//     event.data.object.amount_subtotal,
//     ourTake,
//     event.data.object.amount_subtotal - ourTake
//   )
//   logger.debug(
//     { metadata: metadata },
//     "successfully processed stripe checkout session!"
//   )
// }
