import { NextRequest, NextResponse } from "next/server";

const token = process.env.DIGITALOCEAN_API_TOKEN!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const appId = searchParams.get("appId");
  const deploymentId = searchParams.get("deploymentId");
  const componentName = searchParams.get("componentName");
  const type = searchParams.get("type") || "RUN";
  const rawUrl = searchParams.get("url"); // NEW: support direct log URL

  try {
    // Case 1: Direct log URL (historic log text fetch)
    if (rawUrl) {
      const res = await fetch(rawUrl, { cache: "no-store" });

      if (!res.ok) {
        const error = await res.text();
        return NextResponse.json({ error }, { status: res.status });
      }

      const text = await res.text();
      return NextResponse.json({ logs: text, fullUrl: rawUrl });
    }

    // Case 2: DO Logs API (structured log URLs)
    if (!appId || !deploymentId || !componentName) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const url = `https://api.digitalocean.com/v2/apps/${appId}/deployments/${deploymentId}/components/${componentName}/logs?type=${type}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
