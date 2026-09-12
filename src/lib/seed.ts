import type { Bot } from "@/lib/types";

const now = "2026-03-01T12:00:00.000Z";

function article(
  id: string,
  title: string,
  tags: string[],
  body: string,
) {
  return { id, title, tags, body: body.trim(), updatedAt: now };
}

export const DEMO_API_KEY = "cove_live_demo_northstar";

export function createSeedBots(): Bot[] {
  return [
    {
      id: "bot_northstar",
      name: "Northstar Help",
      slug: "northstar-help",
      description:
        "Answers billing, workspace, and account questions for the Northstar project tool.",
      instructions:
        "You are Northstar Help. Answer from the knowledge base only. Be specific and include the next click or setting the customer needs. If the question is outside Northstar, say so and offer a handoff.",
      welcomeMessage:
        "Hi — I am Northstar Help. Ask about workspaces, billing, invites, or API tokens.",
      handoffMessage:
        "I do not have a confident answer for that. Email support@northstar.example and include your workspace name.",
      tone: "friendly",
      apiKey: DEMO_API_KEY,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
      articles: [
        article(
          "art_reset",
          "Reset your password",
          ["account", "password", "login"],
          `Forgot your password? On the sign-in page, choose Forgot password and enter the email on the account. We send a reset link that expires in 30 minutes.

If the email does not arrive, check spam and confirm you are using the same address as the workspace invite. SSO users cannot reset a password in Northstar — use your identity provider instead.

After you reset, existing sessions stay signed in for 24 hours. Choose Sign out everywhere from Settings → Security if you need them closed immediately.`,
        ),
        article(
          "art_invite",
          "Invite teammates",
          ["team", "invite", "members", "roles"],
          `Open a workspace, then go to Settings → Members → Invite. Enter one email per line and pick a role:

• Admin — manage billing, members, and workspace settings
• Member — create and edit projects, comments, and docs
• Viewer — read-only access to projects they are added to

Invites expire after 14 days. Pending invites can be resent or revoked from the same Members page. Guests cannot invite other people.`,
        ),
        article(
          "art_workspace",
          "Workspaces vs projects",
          ["workspace", "project", "structure"],
          `A workspace is the billing and membership boundary — your company, or a client account. Projects live inside a workspace and hold tasks, docs, and timelines.

Create a workspace from the switcher in the top-left. Create a project with New project on the workspace home. You can move a project between workspaces you admin, but comments and activity stay with the project.

Personal workspaces are free and limited to one member. Team workspaces unlock roles, SSO, and the API.`,
        ),
        article(
          "art_billing",
          "Billing and plans",
          ["billing", "plans", "invoice", "upgrade"],
          `Northstar has three paid plans: Plus ($12/member/month), Business ($20/member/month), and Enterprise (custom).

Admins manage billing under Settings → Billing. You can add a card, switch monthly/annual, and download invoices as PDF. Seats are billed for every Member and Admin; Viewers are free.

Downgrades take effect at the next renewal. If a payment fails, the workspace stays in a 7-day grace period, then projects become read-only until the invoice is paid.`,
        ),
        article(
          "art_tokens",
          "API tokens",
          ["api", "token", "developer", "sdk"],
          `Create a personal API token from Settings → Developer → Tokens. Tokens start with ns_ and can be scoped to read, write, or admin.

Send the token as Authorization: Bearer ns_... on https://api.northstar.example/v1. Rate limit is 120 requests per minute on Plus and 600 on Business.

Revoke a token instantly from the same page. Tokens never appear again after you leave the create dialog, so copy them once. Workspace-level tokens are available on Business and Enterprise.`,
        ),
        article(
          "art_shortcuts",
          "Keyboard shortcuts",
          ["shortcuts", "keyboard", "productivity"],
          `Press ? in the app to open the shortcut list.

Common ones:
• C — create a task
• / — jump to search
• G then P — go to projects
• G then I — go to inbox
• E — edit the selected task
• Cmd+Enter — save a comment

Shortcuts are disabled while a text field is focused, except Cmd+Enter.`,
        ),
        article(
          "art_notify",
          "Notifications",
          ["notifications", "email", "slack"],
          `Notification defaults live in Settings → Notifications. You can choose inbox only, email digest, or immediate email for comments that mention you.

Business and Enterprise workspaces can route a project to Slack with Settings → Integrations → Slack. Northstar posts when a task is assigned, a due date slips, or a comment is left on a watched project.

Mute a single project from the project menu → Mute. Mute lasts until you unmute it — it does not reset each week.`,
        ),
        article(
          "art_export",
          "Export your data",
          ["export", "data", "csv", "privacy"],
          `Workspace admins can export from Settings → Data → Export. Choose CSV for tasks or JSON for a full workspace archive (projects, comments, files metadata).

Exports are emailed as a download link that expires in 48 hours. File binaries are not included in CSV; use the JSON archive plus the attachments zip.

Members can export a single project they can edit from the project menu → Export. GDPR deletion requests go to privacy@northstar.example.`,
        ),
        article(
          "art_sso",
          "SSO and SAML",
          ["sso", "saml", "okta", "security"],
          `SSO is available on Business (Google or Okta OIDC) and Enterprise (SAML 2.0). Admins set it up under Settings → Security → SSO.

After SSO is required, password sign-in is disabled for that workspace. Users still need a Northstar account email that matches the identity provider.

SCIM provisioning is Enterprise-only. If a user is removed in Okta, they lose workspace access within 15 minutes.`,
        ),
        article(
          "art_what",
          "What is Northstar?",
          ["overview", "product", "getting-started"],
          `Northstar is a project tool for teams that want tasks, docs, and timelines in one workspace. It is built for product and operations teams who need roles, an API, and guest access for clients.

Start by creating a workspace, inviting two teammates, and adding one project. The inbox collects mentions and assignments. The timeline view is on Business and Enterprise.

Northstar is not a chat app and does not host customer support tickets — use Cove or your help desk for that.`,
        ),
      ],
    },
  ];
}
