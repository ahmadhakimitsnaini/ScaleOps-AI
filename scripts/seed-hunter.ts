/**
 * seed-hunter.ts
 * 
 * Helper script to register The Hunter agent via Paperclip API.
 * Usage: npx tsx scripts/seed-hunter.ts
 * Note: Make sure Paperclip server is running (pnpm dev) before executing.
 */

const API_BASE = process.env.PAPERCLIP_API_URL || "http://localhost:3100";

async function main() {
  console.log(`Connecting to Paperclip API at ${API_BASE}...`);
  
  // 1. Get companies
  const compRes = await fetch(`${API_BASE}/api/companies`);
  if (!compRes.ok) {
    console.error("❌ Failed to fetch companies. Is Paperclip server running (pnpm dev)?");
    process.exit(1);
  }
  const companies = await compRes.json();
  const company = companies[0];
  
  if (!company) {
    console.error("❌ No companies found. Please finish onboarding in the UI first.");
    process.exit(1);
  }

  // 2. Check if already exists
  const listRes = await fetch(`${API_BASE}/api/companies/${company.id}/agents`);
  const existingAgents = await listRes.json();
  if (existingAgents.some((a: any) => a.name === "The Hunter")) {
    console.log("⚠️ The Hunter agent already exists. Skipping creation.");
    process.exit(0);
  }

  // 3. Create Hunter Agent
  const agentPayload = {
    name: "The Hunter",
    role: "general",
    title: "Prospect Researcher",
    adapterType: "gemini_local",
    adapterConfig: {
      model: "gemini-1.5-flash",
      instructionsFilePath: "agents/hunter/AGENTS.md"
    },
    budgetMonthlyCents: 1000 // 10 USD default budget
  };

  console.log(`Creating agent 'The Hunter' for company '${company.name}'...`);
  const agentRes = await fetch(`${API_BASE}/api/companies/${company.id}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(agentPayload)
  });

  if (!agentRes.ok) {
    const err = await agentRes.text();
    console.error("❌ Failed to create agent:", err);
    process.exit(1);
  }

  const agent = await agentRes.json();
  console.log("✅ The Hunter agent created successfully!");
  console.log(`Agent ID: ${agent.id}`);

  // 4. Ensure it's active
  await fetch(`${API_BASE}/api/agents/${agent.id}/resume`, { method: "POST" });
  console.log("Agent is active and ready.");
}

main().catch(console.error);
