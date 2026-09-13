import { PrismaClient, Role, Sentiment, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const feedbackTemplates = [
  {
    content: "The checkout process is very slow and sometimes takes more than a minute.",
    channel: "Website",
    sentiment: Sentiment.NEG,
    sentimentScore: 0.91,
    featureArea: "Checkout",
    theme: "Checkout Performance",
  },
  {
    content: "I love the new dashboard. It is much easier to understand than before.",
    channel: "Survey",
    sentiment: Sentiment.POS,
    sentimentScore: 0.94,
    featureArea: "Dashboard",
    theme: "User Experience",
  },
  {
    content: "The mobile app crashes whenever I try to upload a profile picture.",
    channel: "App Store",
    sentiment: Sentiment.NEG,
    sentimentScore: 0.96,
    featureArea: "Mobile App",
    theme: "Mobile Stability",
  },
  {
    content: "Please add dark mode to the application.",
    channel: "Chat",
    sentiment: Sentiment.NEU,
    sentimentScore: 0.52,
    featureArea: "UI",
    theme: "UI Improvements",
  },
  {
    content: "Customer support replied quickly and solved my issue.",
    channel: "Email",
    sentiment: Sentiment.POS,
    sentimentScore: 0.89,
    featureArea: "Support",
    theme: "Customer Support",
  },
  {
    content: "The search results are not accurate when I search for older orders.",
    channel: "Survey",
    sentiment: Sentiment.NEG,
    sentimentScore: 0.84,
    featureArea: "Search",
    theme: "Search Quality",
  },
  {
    content: "It would be helpful if I could export reports to Excel.",
    channel: "Email",
    sentiment: Sentiment.NEU,
    sentimentScore: 0.55,
    featureArea: "Reports",
    theme: "Reporting",
  },
  {
    content: "The application loads very quickly now. Great improvement.",
    channel: "Chat",
    sentiment: Sentiment.POS,
    sentimentScore: 0.92,
    featureArea: "Performance",
    theme: "Performance",
  },
  {
    content: "I had trouble resetting my password because the email arrived very late.",
    channel: "Email",
    sentiment: Sentiment.NEG,
    sentimentScore: 0.79,
    featureArea: "Authentication",
    theme: "Authentication",
  },
  {
    content: "The pricing is reasonable compared with other products I have used.",
    channel: "Survey",
    sentiment: Sentiment.POS,
    sentimentScore: 0.82,
    featureArea: "Pricing",
    theme: "Pricing",
  },
  {
    content: "The notifications are too frequent and I would like more control over them.",
    channel: "Chat",
    sentiment: Sentiment.NEG,
    sentimentScore: 0.73,
    featureArea: "Notifications",
    theme: "Notifications",
  },
  {
    content: "The onboarding process was simple and I understood everything quickly.",
    channel: "Survey",
    sentiment: Sentiment.POS,
    sentimentScore: 0.9,
    featureArea: "Onboarding",
    theme: "Onboarding",
  },
];

const themeDescriptions: Record<string, string> = {
  "Checkout Performance": "Feedback related to checkout speed and reliability.",
  "User Experience": "Feedback about overall usability and customer experience.",
  "Mobile Stability": "Issues involving crashes and mobile application stability.",
  "UI Improvements": "Requests and suggestions for interface improvements.",
  "Customer Support": "Feedback about customer service and support interactions.",
  "Search Quality": "Feedback about search accuracy and relevance.",
  Reporting: "Requests and feedback related to reports and exports.",
  Performance: "General application speed and performance feedback.",
  Authentication: "Login, password reset and authentication feedback.",
  Pricing: "Customer feedback about pricing and value.",
  Notifications: "Feedback about alerts and notification controls.",
  Onboarding: "Feedback about the onboarding experience.",
};

async function main() {
  console.log("Starting LOOP database seed...");

  /*
   * 1. Create demo workspace
   */

  const existingUser = await db.user.findUnique({
    where: {
      email: "leelaevana28@gmail.com",
    },
    include: {
      workspace: true,
    },
  });
  
  if (!existingUser) {
    throw new Error(
      "Your user account was not found. Please login/signup first."
    );
  }
  
  const workspace = existingUser.workspace;
  
  console.log(`Using existing workspace: ${workspace.name}`);
  console.log(`Workspace ID: ${workspace.id}`);

  console.log(`Workspace created: ${workspace.name}`);

  /*
   * 2. Create demo users
   */

  const passwordHash = await bcrypt.hash("Demo@123456", 12);

  const users = [
    {
      name: "Demo Admin",
      email: "admin@loop-demo.com",
      role: Role.ADMIN,
    },
    {
      name: "Demo Analyst",
      email: "analyst@loop-demo.com",
      role: Role.ANALYST,
    },
    {
      name: "Demo Viewer",
      email: "viewer@loop-demo.com",
      role: Role.VIEWER,
    },
  ];

  for (const user of users) {
    await db.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        role: user.role,
        workspaceId: workspace.id,
        passwordHash,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: workspace.id,
        passwordHash,
      },
    });
  }

  console.log("3 demo users created.");

  /*
   * 3. Create themes
   */

  const themeMap = new Map<string, string>();

  for (const [name, description] of Object.entries(themeDescriptions)) {
    const existingTheme = await db.theme.findFirst({
      where: {
        workspaceId: workspace.id,
        name,
      },
    });

    const theme =
      existingTheme ??
      (await db.theme.create({
        data: {
          name,
          description,
          workspaceId: workspace.id,
        },
      }));

    themeMap.set(name, theme.id);
  }

  console.log(`${themeMap.size} themes created.`);

  /*
   * 4. Create 120 feedback records
   */

  const existingFeedbackCount = await db.feedback.count({
    where: {
      workspaceId: workspace.id,
    },
  });

  if (existingFeedbackCount === 0) {
    for (let i = 0; i < 120; i++) {
      const template =
        feedbackTemplates[i % feedbackTemplates.length];

      const feedback = await db.feedback.create({
        data: {
          content: `${template.content} Customer reference #${i + 1}.`,
          channel: template.channel,
          sourceRef: `DEMO-${String(i + 1).padStart(4, "0")}`,
          customerLabel: `Customer ${i + 1}`,
          sentiment: template.sentiment,
          sentimentScore: template.sentimentScore,
          featureArea: template.featureArea,
          status:
            i % 3 === 0
              ? FeedbackStatus.ACTIONED
              : i % 3 === 1
              ? FeedbackStatus.REVIEWED
              : FeedbackStatus.NEW,
          workspaceId: workspace.id,
        },
      });

      const themeId = themeMap.get(template.theme);

      if (themeId) {
        await db.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId,
            confidence: 0.85 + (i % 10) / 100,
          },
        });
      }
    }

    console.log("120 feedback records created.");
  } else {
    console.log(
      `Workspace already has ${existingFeedbackCount} feedback records. Skipping feedback seed.`
    );
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });