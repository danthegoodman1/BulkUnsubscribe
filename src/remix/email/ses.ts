import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses"

export const sesClient = new SESClient()

export async function sendSESEmail(
  toAddr: string,
  subject: string,
  content: string
) {
  await sesClient.send(
    new SendEmailCommand({
      Source: process.env.FROM_ADDRESS,
      Destination: {
        ToAddresses: [toAddr],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<p>${content}</p>`,
          },
          Text: {
            Charset: "UTF-8",
            Data: content,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
    })
  )
}
