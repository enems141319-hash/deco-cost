type SendPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

type ResendEmailResponse = {
  id?: string;
  message?: string;
};

function getPasswordResetFromAddress(): string {
  return process.env.PASSWORD_RESET_FROM || "DecoCost <noreply@deco-cost.local>";
}

export function getAppBaseUrl(): string {
  return process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3001";
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: SendPasswordResetEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[password-reset] ${to}: ${resetUrl}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getPasswordResetFromAddress(),
      to,
      subject: "DecoCost 重設密碼",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>重設 DecoCost 密碼</h2>
          <p>請點擊下方連結重設密碼，連結將於 30 分鐘後失效。</p>
          <p><a href="${resetUrl}">重設密碼</a></p>
          <p>如果你沒有提出此要求，可以忽略這封信。</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ResendEmailResponse | null;
    throw new Error(data?.message || "Failed to send password reset email");
  }
}
