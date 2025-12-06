import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: "us-east-1" });

export const handler = async (event: any) => {
    try {
        const { email, name } = event;
        
        const params = {
            Source: "rishabh26072003@gmail.com",
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: "Welcome to our service!",
                    Charset: "UTF-8",
                },
                Body: {
                    Html: {
                        Data: `<h1>Welcome ${name}!</h1><p>Thank you for registering with us.</p>`,
                        Charset: "UTF-8",
                    },
                },
            },
        };

        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Welcome email sent successfully", messageId: result.MessageId }),
        };
    } catch (error) {
        console.error("Error sending email:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to send welcome email" }),
        };
    }
};