
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailProps{
    to: string;
    subject: string;
    html:string
}

export const sendEmail = async ({ to, subject, html }: EmailProps) => {
    //console.log("subject",subject)
 const {data, error} =await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: [to],
    subject,
    html,
 });
    if (error) {
        console.error(error)
    }
    console.log(data)
};
