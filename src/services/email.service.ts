import envVars from "@/config/envVars";
import { Resend } from "resend";

class EmailService {
    private client: Resend;
    private domain: string;

    constructor(apiKey: string, domain: string) {
        this.client = new Resend(apiKey);
        this.domain = domain;
    }

    public async sendEmail(
        to: string,
        subject: string,
        text: string,
    ): Promise<void> {
        await this.client.emails.send({
            from: `Campus Bazaar <mail@${this.domain}>`,
            to,
            subject,
            text,
        });
    }
}

export default new EmailService(envVars.RESEND_API_KEY, envVars.RESEND_DOMAIN);
