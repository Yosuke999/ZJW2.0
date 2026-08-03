import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/_vinext/image") {
      const sourcePath = url.searchParams.get("url");
      if (!sourcePath?.startsWith("/")) return new Response("Invalid image URL", { status: 400 });
      return env.ASSETS.fetch(new Request(new URL(sourcePath, request.url)));
    }
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
