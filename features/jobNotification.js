import cron from "node-cron";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "./sendEmail.js";

export const jobNotification = () => {
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running node cron every 30 mintutes.");
    const jobs = await Job.find({ newsLettersSent: false });
    for (const job of jobs) {
      try {
        const filteredUsers = await User.find({
          $or: [
            { "jobChoices.firstChoice": job.jobCategory },
            { "jobChoices.secondChoice": job.jobCategory },
            { "jobChoices.thirdChoice": job.jobCategory },
          ],
        });
        for (const user of filteredUsers) {
          const subject = `New Job Alert for ${job.title} in  ${job.jobCategory} Available Now`;
          const message = `Hi ${user.name},\n\nA new job that fits your jobCategory has just been posted. The position is for a ${job.title} in ${job.companyName}, and they are looking to hire immediately.\n\nJob Details:\n- **Position:** ${job.title}\n- **Company:** ${job.companyName}\n- **Location:** ${job.location}\n- **Salary:** ${job.salary} \n\nWe’re here to support you in your job search.\n\nBest Regards,\nJobxNepal Team`;
          sendEmail({
            email: user.email,
            subject,
            message,
          });
        }
        job.newsLettersSent = true;
        await job.save();
      } catch (error) {
        console.log("Error occured in node cron.");
        return next(console.error(error || "Error occured in node cron."));
      }
    }
  });
};
