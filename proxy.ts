import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const country = segments[0];
  const requestedLanguage = segments[1];
  const language = requestedLanguage === "ru" || requestedLanguage === "zh"
    ? requestedLanguage
    : country === "kg" ? "ky" : country === "uz" ? "uz" : "zh";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-page-language", language);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|products/|og.png).*)"],
};
