interface EmailTemplate {
  subject: string;
  html: string;
}

export function welcomeTemplate(name: string): EmailTemplate {
  return {
    subject: "Welcome to Base MERN!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome, ${name}!</h1>
        <p>Thank you for registering. Your account has been created successfully.</p>
        <p>You can now log in and start using the platform.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated message from Base MERN.</p>
      </div>
    `,
  };
}

export function passwordResetTemplate(resetUrl: string): EmailTemplate {
  return {
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset</h1>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">This is an automated message from Base MERN.</p>
      </div>
    `,
  };
}
